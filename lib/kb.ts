import { google } from 'googleapis'

// ── In-memory cache (5 min TTL) ──────────────────────────────────────────────
const cache = new Map<string, { content: string; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getCached(key: string): string | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) { cache.delete(key); return null }
    return entry.content
}

function setCache(key: string, content: string) {
    cache.set(key, { content, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ── Google Drive client ───────────────────────────────────────────────────────
function getDriveClient() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set')
    const key = JSON.parse(raw)
    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })
    return google.drive({ version: 'v3', auth })
}

// ── Fetch doc by name ─────────────────────────────────────────────────────────
export async function fetchDocByName(name: string): Promise<string> {
    const cacheKey = `doc:${name}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    console.log('[kb] fetchDocByName:', name)
    const drive = getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

    const search = await drive.files.list({
        q: `name contains '${name}' and '${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
    })

    const files = search.data.files
    if (!files || files.length === 0) {
        console.log('[kb] no file found for:', name)
        return `No document found matching "${name}" in proxie-kb.`
    }

    const file = files[0]
    console.log('[kb] found:', file.name, file.mimeType)
    let content = ''

    if (file.mimeType === 'application/vnd.google-apps.document') {
        const exported = await drive.files.export(
            { fileId: file.id!, mimeType: 'text/plain' },
            { responseType: 'text' }
        )
        content = exported.data as string
    } else {
        content = `[File: ${file.name}] Please convert to Google Docs format for best results.`
    }

    setCache(cacheKey, content)
    return content
}

// ── List all docs ─────────────────────────────────────────────────────────────
export async function listDocs(): Promise<string> {
    const cacheKey = 'list:all'
    const cached = getCached(cacheKey)
    if (cached) return cached

    console.log('[kb] listDocs')
    const drive = getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

    const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
        orderBy: 'name',
    })

    const files = response.data.files || []
    const result = files.map(f => `- ${f.name}`).join('\n')
    const content = `Documents in proxie-kb:\n${result}`

    setCache(cacheKey, content)
    return content
}

// ── Tool definitions (passed to Claude) ──────────────────────────────────────
export const KB_TOOLS = [
    {
        name: 'fetch_kb_doc',
        description: 'Fetch a specific document from the proxie-kb knowledge base by name. Pick the most relevant doc(s) directly based on the question.',
        input_schema: {
            type: 'object' as const,
            properties: {
                doc_name: {
                    type: 'string',
                    description: 'Name of the doc to fetch. E.g. "01-work-history", "03-drive-narrative", "05-technical-stack"'
                }
            },
            required: ['doc_name']
        }
    },
    {
        name: 'list_kb_docs',
        description: 'List all documents available in the proxie-kb knowledge base.',
        input_schema: {
            type: 'object' as const,
            properties: {},
            required: []
        }
    }
]
