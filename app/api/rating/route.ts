import { NextRequest, NextResponse } from 'next/server';
import sql, { initDb } from '@/lib/db';

const VALID_REASONS = [
    'UI Issue',
    'Lack of fluency and poorly articulated',
    "Didn't fully follow my request",
    "I don't like the tone",
    'Others',
];

export async function POST(req: NextRequest) {
    try {
        const {
            session_id,
            message_index,
            rating,
            message_content,
            reason,
            feedback_text,
            server_latency_ms,
            client_latency_ms,
            output_token_count,
            prompt_version,
        } = await req.json();

        if (!session_id || message_index === undefined || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['thumbs_up', 'thumbs_down'].includes(rating)) {
            return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
        }

        if (reason != null && !VALID_REASONS.includes(reason)) {
            return NextResponse.json({ error: 'Invalid reason value' }, { status: 400 });
        }

        await initDb();

        // Ensure the session exists
        const sessionCheck = await sql`SELECT id FROM sessions WHERE id = ${session_id}`;
        if (sessionCheck.length === 0) {
            // Create session if it doesn't exist (though usually it should)
            await sql`INSERT INTO sessions (id) VALUES (${session_id})`;
        }

        await sql`
            INSERT INTO ratings (
                session_id, message_index, message_content, rating, reason, feedback_text,
                server_latency_ms, client_latency_ms, output_token_count, prompt_version
            )
            VALUES (
                ${session_id}, ${message_index}, ${message_content ?? null}, ${rating},
                ${reason ?? null}, ${feedback_text ?? null},
                ${server_latency_ms ?? null}, ${client_latency_ms ?? null},
                ${output_token_count ?? null}, ${prompt_version ?? null}
            )
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Rating error:', error);
        return NextResponse.json({ error: 'Failed to store rating' }, { status: 500 });
    }
}
