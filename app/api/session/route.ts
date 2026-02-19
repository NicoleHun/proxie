import { NextRequest, NextResponse } from 'next/server';
import sql, { initDb } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    try {
        await initDb();
        const results = await sql`SELECT round_count, conversation_history FROM sessions WHERE id = ${sessionId}`;

        if (results.length === 0) {
            return NextResponse.json({
                round_count: 0,
                conversation_history: []
            });
        }

        return NextResponse.json(results[0]);
    } catch (error) {
        console.error('Session fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}
