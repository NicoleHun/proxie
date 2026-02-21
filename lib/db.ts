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
      reason TEXT CONSTRAINT ratings_reason_check CHECK (
        reason IS NULL OR reason IN (
          'UI Issue',
          'Lack of fluency and poorly articulated',
          'Didn''t fully follow my request',
          'I don''t like the tone',
          'Others'
        )
      ),
      feedback_text TEXT,
      server_latency_ms INTEGER,
      client_latency_ms INTEGER,
      output_token_count INTEGER,
      prompt_version TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Migrate existing tables to add new columns if they don't exist
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS message_content TEXT`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS reason TEXT`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS feedback_text TEXT`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS server_latency_ms INTEGER`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS client_latency_ms INTEGER`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS output_token_count INTEGER`;
  await sql`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS prompt_version TEXT`;

  // Add reason CHECK constraint for existing installs.
  // NOT VALID skips validation of pre-existing rows that may contain old free-text values.
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ratings_reason_check'
          AND conrelid = 'ratings'::regclass
      ) THEN
        ALTER TABLE ratings
          ADD CONSTRAINT ratings_reason_check
          CHECK (
            reason IS NULL OR reason IN (
              'UI Issue',
              'Lack of fluency and poorly articulated',
              'Didn''t fully follow my request',
              'I don''t like the tone',
              'Others'
            )
          ) NOT VALID;
      END IF;
    END $$;
  `;
}

export default sql;
