import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql, { initDb } from '@/lib/db';
import { PROXIE_SYSTEM_PROMPT } from '@/lib/constants';
import { KB_TOOLS, fetchDocByName, listDocs } from '@/lib/kb';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Model constants ───────────────────────────────────────────────────────────
// Option 3: Haiku for fast tool-call decisions, Sonnet for quality final answer
const ROUTING_MODEL = 'claude-haiku-4-5-20251001';
const RESPONSE_MODEL = 'claude-sonnet-4-6';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

async function buildContext(message: string, session_id: string) {
    await initDb();

    let session = await sql`SELECT round_count, conversation_history FROM sessions WHERE id = ${session_id}`;
    let roundCount = 0;
    let history: any[] = [];

    if (session.length === 0) {
        await sql`INSERT INTO sessions (id, round_count, conversation_history) VALUES (${session_id}, 0, ${JSON.stringify([])})`;
    } else {
        roundCount = session[0].round_count;
        history = session[0].conversation_history;
    }

    const shouldSendCTA = roundCount === 5 || roundCount === 8 || roundCount === 10 || roundCount >= 11;
    const CTA_NOTE = "\n\n(Note: It's a good moment to naturally surface a CTA. Encourage the user to connect with Nicole directly — suggest scheduling a 20-minute meeting at https://calendly.com/nicolechat/new-meeting. Be warm and non-pushy. Surface it once naturally.)";
    const userContent = shouldSendCTA ? `${message}${CTA_NOTE}` : message;

    const userMessage = { role: 'user' as const, content: userContent };
    const cleanHistory = history.filter((m: any) => m.content && m.content.trim() !== '');
    const messages: any[] = [...cleanHistory, userMessage];

    const systemBlock = {
        type: 'text' as const,
        text: PROXIE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' as const },
    };

    return { messages, systemBlock, cleanHistory, userMessage, roundCount };
}

async function saveToDb(
    session_id: string,
    cleanHistory: any[],
    userMessage: any,
    assistantReply: string,
    roundCount: number
) {
    const savedHistory = [...cleanHistory, userMessage, { role: 'assistant', content: assistantReply }];
    const newRoundCount = roundCount + 1;
    await sql`
        UPDATE sessions
        SET round_count = ${newRoundCount}, conversation_history = ${JSON.stringify(savedHistory)}
        WHERE id = ${session_id}
    `;
    return newRoundCount;
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION 1 + 2 combined: Haiku tool loop → Sonnet streaming reply
//
// How it works:
//   1. Haiku runs the tool-use loop (routing-index + doc fetches) — fast & cheap
//   2. Sonnet streams the final answer token-by-token over SSE
//   3. Frontend renders tokens as they arrive — user sees words at ~2s
//
// Best of both: real latency savings from Haiku + perceived speed from streaming.
// ─────────────────────────────────────────────────────────────────────────────

async function handleStreaming(message: string, session_id: string): Promise<Response> {
    const ctx = await buildContext(message, session_id);
    const { messages, systemBlock, cleanHistory, userMessage, roundCount } = ctx;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            function send(event: string, data: string) {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
            }

            try {
                // Phase 1: Haiku drives the tool-use loop (fast routing + doc fetching)
                send('status', JSON.stringify({ phase: 'thinking' }));

                let haikiResponse = await anthropic.messages.create({
                    model: ROUTING_MODEL,
                    max_tokens: 150,
                    system: [systemBlock],
                    tools: KB_TOOLS as any,
                    messages,
                });

                while (haikiResponse.stop_reason === 'tool_use') {
                    const assistantContent = haikiResponse.content;
                    const toolUseBlocks = assistantContent.filter((b: any) => b.type === 'tool_use');

                    console.log('[stream] haiku tool calls:', toolUseBlocks.map((b: any) => `${b.name}(${JSON.stringify(b.input)})`));
                    send('status', JSON.stringify({ phase: 'fetching' }));

                    const toolResults = await Promise.all(
                        toolUseBlocks.map(async (block: any) => {
                            let result: string;
                            try {
                                if (block.name === 'fetch_kb_doc') {
                                    result = await fetchDocByName(block.input.doc_name);
                                } else if (block.name === 'list_kb_docs') {
                                    result = await listDocs();
                                } else {
                                    result = `Unknown tool: ${block.name}`;
                                }
                            } catch (err: any) {
                                result = `Error executing ${block.name}: ${err.message}`;
                            }
                            return {
                                type: 'tool_result' as const,
                                tool_use_id: block.id,
                                content: result,
                            };
                        })
                    );

                    messages.push({ role: 'assistant', content: assistantContent });
                    messages.push({ role: 'user', content: toolResults });

                    haikiResponse = await anthropic.messages.create({
                        model: ROUTING_MODEL,
                        max_tokens: 150,
                        system: [systemBlock],
                        tools: KB_TOOLS as any,
                        messages,
                    });
                }

                // Phase 2: Sonnet streams the final reply with full doc context from Haiku.
                send('status', JSON.stringify({ phase: 'responding' }));
                console.log('[stream] haiku done, handing off to sonnet for streaming reply');

                // Flatten messages for Sonnet — strip all tool_use/tool_result turns and
                // inject the fetched doc content as a single clean user context block.
                // This way Sonnet sees no tool scaffolding at all: just the conversation
                // history, the retrieved docs as context, and the user's question.
                const docContents: string[] = [];
                for (const msg of messages) {
                    if (Array.isArray(msg.content)) {
                        for (const block of msg.content) {
                            if (block.type === 'tool_result' && block.content) {
                                docContents.push(block.content);
                            }
                        }
                    }
                }

                // Build a clean message list: prior conversation + doc context + user question
                const sonnetMessages: any[] = [
                    ...cleanHistory,
                    ...(docContents.length > 0 ? [{
                        role: 'user',
                        content: `Here are the relevant documents retrieved for this question:\n\n${docContents.join('\n\n---\n\n')}`,
                    }, {
                        role: 'assistant',
                        content: 'Thanks, I have the documents. What would you like to know?',
                    }] : []),
                    userMessage,
                ];

                console.log('[stream] sonnet messages count:', sonnetMessages.length, '| docs injected:', docContents.length);

                const streamResp = anthropic.messages.stream({
                    model: RESPONSE_MODEL,
                    max_tokens: 300,
                    system: [systemBlock],
                    messages: sonnetMessages,
                });

                let fullText = '';
                for await (const chunk of streamResp) {
                    if (
                        chunk.type === 'content_block_delta' &&
                        chunk.delta?.type === 'text_delta'
                    ) {
                        const text = (chunk.delta as any).text as string;
                        fullText += text;
                        send('token', JSON.stringify({ text }));
                    }
                }

                console.log('[stream] sonnet reply length:', fullText.length);

                if (fullText) {
                    const newRoundCount = await saveToDb(session_id, cleanHistory, userMessage, fullText, roundCount);
                    send('done', JSON.stringify({ session_id, round_count: newRoundCount }));
                } else {
                    send('error', JSON.stringify({ message: 'Empty response from Claude' }));
                }
            } catch (err: any) {
                console.error('[stream] error:', err.message);
                console.error('[stream] error status:', (err as any)?.status);
                console.error('[stream] error body:', JSON.stringify((err as any)?.error ?? (err as any)?.message));
                send('error', JSON.stringify({ message: err.message }));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Original implementation — unchanged baseline
// ─────────────────────────────────────────────────────────────────────────────

async function handleOriginal(message: string, session_id: string): Promise<Response> {
    await initDb();

    let session = await sql`SELECT round_count, conversation_history FROM sessions WHERE id = ${session_id}`;
    let roundCount = 0;
    let history: any[] = [];

    if (session.length === 0) {
        await sql`INSERT INTO sessions (id, round_count, conversation_history) VALUES (${session_id}, 0, ${JSON.stringify([])})`;
    } else {
        roundCount = session[0].round_count;
        history = session[0].conversation_history;
    }

    const systemPrompt = PROXIE_SYSTEM_PROMPT;
    const shouldSendCTA = roundCount === 5 || roundCount === 8 || roundCount === 10 || roundCount >= 11;
    const CTA_NOTE = "\n\n(Note: It's a good moment to naturally surface a CTA. Encourage the user to connect with Nicole directly — suggest scheduling a 20-minute meeting at https://calendly.com/nicolechat/new-meeting. Be warm and non-pushy. Surface it once naturally.)";
    const userContent = shouldSendCTA ? `${message}${CTA_NOTE}` : message;
    const userMessage = { role: 'user' as const, content: userContent };
    const cleanHistory = history.filter((m: any) => m.content && m.content.trim() !== '');
    const messages: any[] = [...cleanHistory, userMessage];

    console.log('[chat] model: claude-sonnet-4-6 | history:', messages.length, '| system:', systemPrompt.length, 'chars');

    const systemBlock = {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
    };
    console.log('[cache-debug]', JSON.stringify(systemBlock.cache_control));

    let response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: [systemBlock],
        tools: KB_TOOLS as any,
        messages,
    });

    const u1 = response.usage as any;
    console.log('[cache] initial:', {
        cache_created: u1.cache_creation_input_tokens ?? u1.cache_creation?.ephemeral_5m_input_tokens ?? 0,
        cache_read: u1.cache_read_input_tokens ?? 0,
        input: u1.input_tokens,
        output: u1.output_tokens,
    });
    console.log('[chat] initial stop_reason:', response.stop_reason);

    while (response.stop_reason === 'tool_use') {
        const assistantContent = response.content;
        const toolUseBlocks = assistantContent.filter((b: any) => b.type === 'tool_use');

        console.log('[chat] tool calls:', toolUseBlocks.map((b: any) => `${b.name}(${JSON.stringify(b.input)})`));

        const toolResults = await Promise.all(
            toolUseBlocks.map(async (block: any) => {
                let result: string;
                try {
                    if (block.name === 'fetch_kb_doc') {
                        result = await fetchDocByName(block.input.doc_name);
                    } else if (block.name === 'list_kb_docs') {
                        result = await listDocs();
                    } else {
                        result = `Unknown tool: ${block.name}`;
                    }
                } catch (err: any) {
                    console.error('[chat] tool error:', block.name, err.message);
                    result = `Error executing ${block.name}: ${err.message}`;
                }
                console.log('[chat] tool result for', block.name, ':', result.slice(0, 100) + '...');
                return {
                    type: 'tool_result' as const,
                    tool_use_id: block.id,
                    content: result,
                };
            })
        );

        messages.push({ role: 'assistant', content: assistantContent });
        messages.push({ role: 'user', content: toolResults });

        response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 180,
            system: [systemBlock],
            tools: KB_TOOLS as any,
            messages,
        });

        const u2 = response.usage as any;
        console.log('[cache] follow-up:', {
            cache_created: u2.cache_creation_input_tokens ?? u2.cache_creation?.ephemeral_5m_input_tokens ?? 0,
            cache_read: u2.cache_read_input_tokens ?? 0,
            input: u2.input_tokens,
            output: u2.output_tokens,
        });
        console.log('[chat] follow-up stop_reason:', response.stop_reason);
    }

    const assistantReply = response.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

    console.log('[chat] final reply length:', assistantReply.length);

    if (!assistantReply) {
        console.error('[chat] WARNING: empty reply — not saving to history');
        return NextResponse.json({ reply: "I'm having trouble accessing the knowledge base right now. Please try again.", session_id, round_count: roundCount });
    }

    const savedHistory = [...cleanHistory, userMessage, { role: 'assistant', content: assistantReply }];
    const newRoundCount = roundCount + 1;

    await sql`
        UPDATE sessions SET round_count = ${newRoundCount}, conversation_history = ${JSON.stringify(savedHistory)} WHERE id = ${session_id}
    `;

    return NextResponse.json({ reply: assistantReply, session_id, round_count: newRoundCount });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main POST handler
//
// Select mode via query param or LATENCY_MODE env var:
//   ?mode=stream  → Haiku tool loop + Sonnet streaming reply (best of both)
//   (default)     → original behavior (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        let { message, session_id } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        if (!session_id) {
            session_id = crypto.randomUUID();
        }

        const mode = req.nextUrl.searchParams.get('mode')
            ?? process.env.LATENCY_MODE
            ?? 'original';

        console.log('[chat] mode:', mode, '| message length:', message.length);

        switch (mode) {
            case 'stream':
                return handleStreaming(message, session_id);
            default:
                return handleOriginal(message, session_id);
        }
    } catch (error: any) {
        console.error('[chat] Error status:', error?.status);
        console.error('[chat] Error body:', JSON.stringify(error?.error ?? error?.message));
        console.error('[chat] Request ID:', error?.requestID);
        return NextResponse.json({ error: 'Failed to process chat', details: error.message }, { status: 500 });
    }
}
