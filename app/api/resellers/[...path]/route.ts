import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const UPSTREAM_BASE = "https://dash.prime-stream.site/api"

function buildUpstreamUrl(req: NextRequest, path: string[] = []) {
  const search = req.nextUrl.search
  const suffix = path.length ? `/${path.join('/')}` : ""
  return `${UPSTREAM_BASE}${suffix}${search}`
}

async function forward(req: NextRequest, path: string[]) {
  const url = buildUpstreamUrl(req, path)
  const method = req.method
  const headers: Record<string, string> = {}
  const contentType = req.headers.get("content-type")
  if (contentType) headers["content-type"] = contentType

  const init: RequestInit = { method, headers }

  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer()
    init.body = body
  }

  try {
    const res = await fetch(url, init)
    const resContentType = res.headers.get("content-type") || "application/json"
    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
      status: res.status,
      headers: { "content-type": resContentType },
    })
  } catch (e) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params.path || [])
}

export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params.path || [])
}

export async function PUT(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params.path || [])
}

export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params.path || [])
}

