"use client";

import BasicSearchBox from "./basic-search-box";
import AdvancedSearchInput from "./advanced-search-box";
import { Switch } from "@/components/ui/switch";
import React, { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Code } from "lucide-react";
import ManualDialog from "./manual-dialog";
import AdvancedFilterBuilder, { getCachedFilterRule } from "./filter-sphere";
import { forumData } from "./filter-sphere/forum-data";

export interface Props {
  query: string;
  initAdvancedSearch: boolean;
  forumId: string;
  onChange: (s: string) => void;
  onSortChange: (sort: Sort) => void;
  onForumChange: (forumId: string) => void;
}

export enum Sort {
  Relevance = "relevance",
  DateDesc = "now:desc",
  DateAsc = "now:asc",
}

export default function Search(props: Props) {
  const [useAdvancedSearch, setUseAdvancedSearch] = React.useState(
    props.initAdvancedSearch
  );
  const [isQueryMode, setIsQueryMode] = React.useState(
    props.initAdvancedSearch && !getCachedFilterRule(props.query)
  );
  const [sort, setSort] = React.useState<Sort>(Sort.Relevance);
  useEffect(() => {
    props.onSortChange(sort);
  }, [sort]);

  return (
    <div className="w-full font-semibold">
      <div className="flex flex-row items-center justify-end mb-2">
        <div className="mr-auto hidden md:block">
          <ManualDialog />
        </div>
        {useAdvancedSearch && (
          <>
            <Toggle
              aria-label="Toggle query mode"
              id="query-mode"
              size="sm"
              defaultPressed={!isQueryMode}
              variant="neutral"
              onPressedChange={(pressed) => setIsQueryMode(!pressed)}
            >
              <Code strokeWidth={3.2} />
              Query
            </Toggle>
          </>
        )}
        <label className="mx-2 ms-4" htmlFor="use-advanced">
          高级搜索
        </label>
        <Switch
          className="inline-block"
          id="use-advanced"
          checked={useAdvancedSearch}
          onCheckedChange={(prev) => setUseAdvancedSearch(prev)}
        />
        <div className="flex flex-row items-center">
          <label className="mx-2" htmlFor="">
            排序方式
          </label>
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as Sort)}
          >
            <SelectTrigger className="w-[120px] md:w-[160px]">
              <SelectValue placeholder="默认相关性" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="relevance">相关性</SelectItem>
                <SelectLabel
                  style={{
                    marginInlineStart: "-3ch",
                  }}
                >
                  发帖时间
                </SelectLabel>
                <SelectItem value="now:desc">最新发帖</SelectItem>
                <SelectItem value="now:asc">最早发帖</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-row items-center ms-2">
          <label className="mx-2" htmlFor="">
            版块
          </label>
          <Select value={props.forumId} onValueChange={props.onForumChange}>
            <SelectTrigger className="w-[120px] md:w-[160px]">
              <SelectValue placeholder="全部版块" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">全部版块</SelectItem>
                {forumData.map((forum) => (
                  <SelectItem key={forum.id} value={forum.id}>
                    {forum.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {useAdvancedSearch ? (
        isQueryMode ? (
          <AdvancedSearchInput value={props.query} onChange={props.onChange} />
        ) : (
          <AdvancedFilterBuilder
            value={props.query}
            onChange={props.onChange}
          />
        )
      ) : (
        <BasicSearchBox query={props.query} handleChange={props.onChange} />
      )}
      {/* <Button size="lg" type="submit">搜索</Button> */}
    </div>
  );
}
