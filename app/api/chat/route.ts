import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql, { initDb } from '@/lib/db';
import { PROXIE_SYSTEM_PROMPT } from '@/lib/constants';
import { KB_TOOLS, fetchDocByName, listDocs } from '@/lib/kb';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        let { message, session_id } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Missing message' }, { status: 400 });
        }

        if (!session_id) {
            session_id = crypto.randomUUID();
        }

        await initDb();

        // 1. Fetch existing session or create a new one
        let session = await sql`SELECT round_count, conversation_history FROM sessions WHERE id = ${session_id}`;

        let roundCount = 0;
        let history: any[] = [];

        if (session.length === 0) {
            await sql`INSERT INTO sessions (id, round_count, conversation_history) VALUES (${session_id}, 0, ${JSON.stringify([])})`;
        } else {
            roundCount = session[0].round_count;
            history = session[0].conversation_history;
        }

        // 2. System prompt is immutable — never mutated, always cache-hits after first request
        const systemPrompt = PROXIE_SYSTEM_PROMPT;

        // 3. Build message history — filter out empty assistant turns from previous failures
        const shouldSendCTA = roundCount === 5 || roundCount === 8 || roundCount === 10 || roundCount >= 11;
        const CTA_NOTE = "\n\n(Note: It's a good moment to naturally surface a CTA. Encourage the user to connect with Nicole directly — suggest scheduling a 20-minute meeting at https://calendly.com/nicolechat/new-meeting. Be warm and non-pushy. Surface it once naturally.)";

        const userContent = shouldSendCTA ? `${message}${CTA_NOTE}` : message;
        const userMessage = { role: 'user' as const, content: userContent };
        const cleanHistory = history.filter((m: any) => m.content && m.content.trim() !== '')
        const messages: any[] = [...cleanHistory, userMessage];

        console.log('[chat] model: claude-sonnet-4-6 | history:', messages.length, '| system:', systemPrompt.length, 'chars');

        // 4. Agentic tool loop — follows MCP guide pattern
        //    Claude calls fetch_kb_doc / list_kb_docs, we execute them, feed results back
        let response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 300,
            system: [
                {
                    type: 'text',
                    text: systemPrompt,
                    cache_control: { type: 'ephemeral' },
                }
            ],
            tools: KB_TOOLS as any,
            messages,
        });

        console.log('[cache] initial:', response.usage);
        console.log('[chat] initial stop_reason:', response.stop_reason);

        // Loop while Claude wants to use tools
        while (response.stop_reason === 'tool_use') {
            const assistantContent = response.content;
            const toolUseBlocks = assistantContent.filter((b: any) => b.type === 'tool_use');

            console.log('[chat] tool calls:', toolUseBlocks.map((b: any) => `${b.name}(${JSON.stringify(b.input)})`));

            // Execute each tool call
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

            // Append assistant turn + tool results, then call Claude again
            messages.push({ role: 'assistant', content: assistantContent });
            messages.push({ role: 'user', content: toolResults });

            response = await anthropic.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 300,
                system: [
                    {
                        type: 'text',
                        text: systemPrompt,
                        cache_control: { type: 'ephemeral' },
                    }
                ],
                tools: KB_TOOLS as any,
                messages,
            });

            console.log('[cache] follow-up:', response.usage);
            console.log('[chat] follow-up stop_reason:', response.stop_reason);
        }

        // Extract final text reply
        const assistantReply = response.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('');

        console.log('[chat] final reply length:', assistantReply.length);

        if (!assistantReply) {
            console.error('[chat] WARNING: empty reply — not saving to history');
            return NextResponse.json({ reply: "I'm having trouble accessing the knowledge base right now. Please try again.", session_id, round_count: roundCount });
        }

        // 5. Save to DB (only the user + final assistant turns — not the intermediate tool messages)
        const savedHistory = [...cleanHistory, userMessage, { role: 'assistant', content: assistantReply }];
        const newRoundCount = roundCount + 1;

        await sql`
            UPDATE sessions SET round_count = ${newRoundCount}, conversation_history = ${JSON.stringify(savedHistory)} WHERE id = ${session_id}
        `;

        return NextResponse.json({ reply: assistantReply, session_id, round_count: newRoundCount });

    } catch (error: any) {
        console.error('[chat] Error status:', error?.status);
        console.error('[chat] Error body:', JSON.stringify(error?.error ?? error?.message));
        console.error('[chat] Request ID:', error?.requestID);
        return NextResponse.json({ error: 'Failed to process chat', details: error.message }, { status: 500 });
    }
}
