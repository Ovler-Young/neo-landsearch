import { describe, expect, it } from "vitest";
import {
  appendForumBlacklistQuery,
  buildForumBlacklistQuery,
  parseBlacklistedForumIds,
} from "./forumBlacklist";

describe("parseBlacklistedForumIds", () => {
  it("parses comma-separated forum ids", () => {
    expect(parseBlacklistedForumIds("98, 96,,20")).toEqual(["98", "96", "20"]);
  });
});

describe("buildForumBlacklistQuery", () => {
  it("builds no filter for an empty blacklist", () => {
    expect(buildForumBlacklistQuery([])).toBe("");
  });

  it("builds a not-equals filter for a single blacklisted forum", () => {
    expect(buildForumBlacklistQuery(["98"])).toBe("(fid != 98)");
  });

  it("builds a not-in filter for multiple blacklisted forums", () => {
    expect(buildForumBlacklistQuery(["98", "96"])).toBe(
      "(fid NOT IN [98, 96])"
    );
  });

  it("deduplicates repeated forum ids", () => {
    expect(buildForumBlacklistQuery(["98", "98", "96"])).toBe(
      "(fid NOT IN [98, 96])"
    );
  });
});

describe("appendForumBlacklistQuery", () => {
  it("leaves query unchanged when no forums are blacklisted", () => {
    expect(appendForumBlacklistQuery("test", [])).toBe("test");
  });

  it("appends blacklist filter to a text query", () => {
    expect(appendForumBlacklistQuery("岛", ["98", "96"])).toBe(
      "岛 (fid NOT IN [98, 96])"
    );
  });

  it("appends blacklist filter to an existing forum filter", () => {
    expect(appendForumBlacklistQuery("岛 (fid = 4)", ["98", "96"])).toBe(
      "岛 (fid = 4) (fid NOT IN [98, 96])"
    );
  });

  it("returns only the blacklist filter for an empty query", () => {
    expect(appendForumBlacklistQuery(" ", ["98"])).toBe("(fid != 98)");
  });
});
