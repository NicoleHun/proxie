import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// ── In-memory cache (5 min TTL) ──────────────────────────────────────────────
const cache = new Map<string, { content: string; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000

function getCached(key: string): string | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
    }
    return entry.content
}

function setCache(key: string, content: string) {
    cache.set(key, { content, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ── Google Drive client ───────────────────────────────────────────────────────
function getDriveClient() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    if (!raw) throw new Error('[mcp] GOOGLE_SERVICE_ACCOUNT_KEY is not set')
    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) throw new Error('[mcp] GOOGLE_DRIVE_FOLDER_ID is not set')

    const key = JSON.parse(raw)
    console.log('[mcp] auth as:', key.client_email)

    const auth = new google.auth.GoogleAuth({
        credentials: key,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    })
    return google.drive({ version: 'v3', auth })
}

// ── Fetch doc content by name ─────────────────────────────────────────────────
async function fetchDocByName(name: string): Promise<string> {
    const cacheKey = `doc:${name}`
    const cached = getCached(cacheKey)
    if (cached) return cached

    console.log('[mcp] fetchDocByName:', name)
    const drive = getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

    const search = await drive.files.list({
        q: `name contains '${name}' and '${folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType)',
    })

    const files = search.data.files
    if (!files || files.length === 0) {
        console.log('[mcp] no file found for:', name)
        return `No document found matching "${name}" in proxie-kb.`
    }
    console.log('[mcp] found file:', files[0].name, files[0].mimeType)

    const file = files[0]
    let content = ''

    if (file.mimeType === 'application/vnd.google-apps.document') {
        const exported = await drive.files.export(
            { fileId: file.id!, mimeType: 'text/plain' },
            { responseType: 'text' }
        )
        content = exported.data as string
    } else {
        content = `[File: ${file.name}] Please convert this file to Google Docs format for best results.`
    }

    setCache(cacheKey, content)
    return content
}

// ── List all docs in folder ───────────────────────────────────────────────────
async function listDocs(): Promise<string> {
    const cacheKey = 'list:all'
    const cached = getCached(cacheKey)
    if (cached) return cached

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

// ── MCP Tool Definitions ──────────────────────────────────────────────────────
const MCP_TOOLS = [
    {
        name: 'fetch_kb_doc',
        description: 'Fetch a specific document from the proxie-kb knowledge base by name. Pick the most relevant doc(s) directly based on the question.',
        input_schema: {
            type: 'object',
            properties: {
                doc_name: {
                    type: 'string',
                    description: 'Name of the doc to fetch. Examples: "01-work-history", "03-drive-narrative", "07-gap-handling"'
                }
            },
            required: ['doc_name']
        }
    },
    {
        name: 'list_kb_docs',
        description: 'List all documents available in the proxie-kb knowledge base.',
        input_schema: {
            type: 'object',
            properties: {},
            required: []
        }
    }
]

// ── HTTP Handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    let id: string | number | null = null

    try {
        const body = await request.json()
        const { method, params } = body
        id = body.id ?? null

        console.log('[mcp] method:', method, '| id:', id)

        // JSON-RPC 2.0 helper
        const ok = (result: unknown) => NextResponse.json({ jsonrpc: '2.0', id, result })
        const err = (code: number, message: string) =>
            NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } })

        if (method === 'initialize') {
            return ok({
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'proxie-kb', version: '1.0.0' }
            })
        }

        if (method === 'notifications/initialized') {
            // Notification — no response needed
            return new NextResponse(null, { status: 204 })
        }

        if (method === 'tools/list') {
            return ok({ tools: MCP_TOOLS })
        }

        if (method === 'tools/call') {
            const { name, arguments: args } = params

            if (name === 'fetch_kb_doc') {
                const content = await fetchDocByName(args.doc_name)
                return ok({ content: [{ type: 'text', text: content }] })
            }

            if (name === 'list_kb_docs') {
                const content = await listDocs()
                return ok({ content: [{ type: 'text', text: content }] })
            }

            return err(-32601, `Unknown tool: ${name}`)
        }

        return err(-32600, `Unknown method: ${method}`)

    } catch (error: any) {
        console.error('[mcp] error:', error)
        return NextResponse.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: 'Internal server error' }
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({ status: 'proxie-kb MCP server running' })
}