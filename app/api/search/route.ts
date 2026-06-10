import { NextRequest, NextResponse } from "next/server";

function getApiBackend() {
  return process.env.API_BACKEND;
}

export async function GET(request: NextRequest) {
  const apiBackend = getApiBackend();

  if (!apiBackend) {
    return NextResponse.json(
      { error: "API_BACKEND is not configured" },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL("/api/search", apiBackend);
  upstreamUrl.search = request.nextUrl.searchParams.toString();

  const response = await fetch(upstreamUrl, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
