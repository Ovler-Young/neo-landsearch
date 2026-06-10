import { NextResponse } from "next/server";

function getApiBackend() {
  return process.env.API_BACKEND;
}

export async function GET() {
  const apiBackend = getApiBackend();

  if (!apiBackend) {
    return NextResponse.json(
      { error: "API_BACKEND is not configured" },
      { status: 500 }
    );
  }

  const upstreamUrl = new URL("/api/stats", apiBackend);

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
