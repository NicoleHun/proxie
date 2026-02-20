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


        // 3. Update history with user message
        const userMessage = { role: 'user', content: message };
        const updatedHistory = [...history, userMessage];

        // 4. Call Anthropic API with prompt caching
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 500,
            temperature: 0.7,
            system: [
                {
                    type: "text",
                    text: systemPrompt,
                    cache_control: { type: "ephemeral" } as any
                }
            ],
            messages: updatedHistory,
        }, {
            headers: { "anthropic-beta": "prompt-caching-2024-07-31" }
        });

        const assistantReply = response.content[0].type === 'text' ? response.content[0].text : '';
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
        console.error('Chat API Error:', error);
        return NextResponse.json({
            error: 'Failed to process chat',
            details: error.message
        }, { status: 500 });
    }
}
