import { NextRequest, NextResponse } from "next/server";
import {
  appendForumBlacklistQuery,
  parseBlacklistedForumIds,
} from "../../utils/forumBlacklist";

function getApiBackend() {
  return process.env.API_BACKEND;
}

function getBlacklistedForumIds() {
  return parseBlacklistedForumIds(process.env.NEXT_PUBLIC_BLACKLIST_FIDS);
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
  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  const query = searchParams.get("q");
  if (query !== null) {
    searchParams.set(
      "q",
      appendForumBlacklistQuery(query, getBlacklistedForumIds())
    );
  }
  upstreamUrl.search = searchParams.toString();

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
