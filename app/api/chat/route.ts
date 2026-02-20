import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import sql, { initDb } from '@/lib/db';
import { PROXIE_SYSTEM_PROMPT } from '@/lib/constants';

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

        // 2. Prepare System Prompt
        let systemPrompt = PROXIE_SYSTEM_PROMPT;
        const CTA_PROMPT = "\n\n(Note: It's a good moment to naturally surface a CTA. Encourage the user to connect with Nicole directly — suggest scheduling a 20-minute call at https://calendly.com/nicolechat/new-meeting. Be warm and non-pushy. Surface it once naturally.)";

        const shouldSendCTA = roundCount === 5 || roundCount === 8 || roundCount === 10 || roundCount >= 11;

        if (shouldSendCTA) {
            systemPrompt += CTA_PROMPT;
        }


        // 3. Update history with user message — filter out any empty assistant turns from previous failures
        const userMessage = { role: 'user', content: message };
        const cleanHistory = history.filter((m: any) => m.content && m.content.trim() !== '')
        const updatedHistory = [...cleanHistory, userMessage];

        // Build MCP URL — VERCEL_URL is hostname-only in production (no protocol)
        const vercelUrl = process.env.VERCEL_URL ?? ''
        const mcpUrl = vercelUrl.startsWith('http')
            ? `${vercelUrl}/api/mcp`
            : `https://${vercelUrl}/api/mcp`
        console.log('[chat] MCP URL:', mcpUrl)

        const model = "claude-sonnet-4-6"
        const betaHeader = "mcp-client-2025-04-04"
        console.log('[chat] calling anthropic | model:', model, '| beta:', betaHeader)
        console.log('[chat] mcp url:', mcpUrl)
        console.log('[chat] history length:', updatedHistory.length)
        console.log('[chat] system prompt length:', systemPrompt.length)

        // 4. Call Anthropic API — MCP only (prompt-caching removed to isolate 500)
        const response = await (anthropic.messages.create as any)({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            temperature: 0.7,
            system: systemPrompt,
            messages: updatedHistory,
            mcp_servers: [
                {
                    type: 'url',
                    url: mcpUrl,
                    name: 'proxie-kb'
                }
            ]
        }, {
            headers: { "anthropic-beta": betaHeader }
        });
        console.log('[chat] anthropic responded | stop_reason:', response.stop_reason)
        console.log('[chat] content blocks:', JSON.stringify(response.content?.map((b: any) => ({ type: b.type, len: b.text?.length }))))

        const assistantReply = response.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('')

        console.log('[chat] assistantReply length:', assistantReply.length)
        if (!assistantReply) {
            console.error('[chat] WARNING: empty reply from Claude — not saving to history')
            return NextResponse.json({ reply: "I'm having trouble retrieving the knowledge base right now. Please try again.", session_id, round_count: roundCount });
        }

        const assistantMessage = { role: 'assistant', content: assistantReply };

        // 5. Update DB
        const finalHistory = [...updatedHistory, assistantMessage];
        const newRoundCount = roundCount + 1;

        await sql`
            UPDATE sessions SET round_count = ${newRoundCount}, conversation_history = ${JSON.stringify(finalHistory)} WHERE id = ${session_id}
        `;

        // 6. Return response
        return NextResponse.json({
            reply: assistantReply,
            session_id,
            round_count: newRoundCount
        });

    } catch (error: any) {
        console.error('[chat] Error status:', error?.status)
        console.error('[chat] Error body:', JSON.stringify(error?.error ?? error?.message))
        console.error('[chat] Request ID:', error?.requestID)
        return NextResponse.json({
            error: 'Failed to process chat',
            details: error.message
        }, { status: 500 });
    }
}
