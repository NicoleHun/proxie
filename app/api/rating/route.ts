import { NextRequest, NextResponse } from 'next/server';
import sql, { initDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { session_id, message_index, rating } = await req.json();

        if (!session_id || message_index === undefined || !rating) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['thumbs_up', 'thumbs_down'].includes(rating)) {
            return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
        }

        await initDb();

        // Ensure the session exists
        const sessionCheck = await sql`SELECT id FROM sessions WHERE id = ${session_id}`;
        if (sessionCheck.length === 0) {
            // Create session if it doesn't exist (though usually it should)
            await sql`INSERT INTO sessions (id) VALUES (${session_id})`;
        }

        await sql`
            INSERT INTO ratings (session_id, message_index, rating) VALUES (${session_id}, ${message_index}, ${rating})
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Rating error:', error);
        return NextResponse.json({ error: 'Failed to store rating' }, { status: 500 });
    }
}
