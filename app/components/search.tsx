"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchResults from "./search-results";
import debounce from "lodash.debounce";
import SearchBox, { Sort } from "./search-box";

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();

  let initialQuery = decodeURIComponent(searchParams.get("q") || "");
  const nameQuery = decodeURIComponent(
    searchParams.get("name") || searchParams.get("author") || ""
  );
  let simple = !!(searchParams.get("simple") || "");

  if (nameQuery) {
    initialQuery += ` (name="${nameQuery}")`;
  }

  let initSort = decodeURIComponent(searchParams.get("sort") || "relevance");
  if (!initSort) initSort = "relevance";
  let [sort, setSort] = useState<Sort>(initSort as Sort);
  const [forumId, setForumId] = useState(searchParams.get("fid") || "all");

  const [query, setQuery] = useState(initialQuery);

  const getSearchUrl = useCallback(
    (value: string, nextSort = sort, nextForumId = forumId) => {
      let h = `/search?q=${encodeURIComponent(value)}`;
      if (nextSort !== "relevance") {
        h += `&sort=${nextSort}`;
      }
      if (nextForumId !== "all") {
        h += `&fid=${nextForumId}`;
      }
      return h;
    },
    [sort, forumId]
  );

  const debouncedUpdateURL = useCallback(
    debounce((value: string) => {
      router.push(getSearchUrl(value), { scroll: false });
    }, 300),
    [getSearchUrl]
  );

  function isAdvancedSearch(query: string) {
    return query.includes("(") && query.endsWith(")");
  }

  // 清理 debounce
  useEffect(() => {
    return () => {
      debouncedUpdateURL.cancel();
    };
  }, [debouncedUpdateURL]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.length) return
    router.push(getSearchUrl(query), { scroll: false });
  };

  const handleInputChange = (s: string) => {
    if (s === query) return;
    setQuery(s);
    debouncedUpdateURL(s);
  };

  useEffect(() => {
    if (query) {
      router.push(getSearchUrl(query), { scroll: false });
    }
  }, [sort, forumId]);

  const searchQuery =
    forumId === "all" ? query : `${query} (fid = ${forumId})`;

  return (
    <div>
      <form
        onSubmit={handleSearch}
        className={`flex w-full items-center space-x-2 mx-auto${
          simple ? " hidden" : ""
        }`}
      >
        <SearchBox
          query={query}
          initAdvancedSearch={isAdvancedSearch(query)}
          forumId={forumId}
          onChange={handleInputChange}
          onSortChange={setSort}
          onForumChange={setForumId}
        />
      </form>

      {query && (
        <SearchResults
          key={`${searchQuery}-${sort}`}
          initialQuery={searchQuery}
          initialPage={0}
          sort={sort}
        />
      )}
    </div>
  );
}
