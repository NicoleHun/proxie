import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      round_count INTEGER DEFAULT 0,
      conversation_history JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      session_id TEXT REFERENCES sessions(id),
      message_index INTEGER,
      message_content TEXT,
      rating TEXT CHECK (rating IN ('thumbs_up', 'thumbs_down')),
      reason TEXT,
      feedback_text TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Migrate existing tables to add new columns if they don't exist
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS message_content TEXT`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS reason TEXT`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS feedback_text TEXT`;
}

export default sql;
