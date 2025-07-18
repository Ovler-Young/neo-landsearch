import { defineTypedFn, FnSchema, presetFilter } from "@fn-sphere/filter";
import { z } from "zod";
import { zhCN } from "@fn-sphere/filter/locales";
import { fidSchema, forumData } from "./forum-data";

export const filterSchema = z.object({
  type: z.union([z.literal("thread"), z.literal("reply")]).describe("帖子类型"),
  name: z.string().describe("名字"),
  title: z.string().describe("回复标题"),
  content: z.string().describe("回复内容"),

  userid: z.string().describe("饼干"),
  id: z.number().describe("回复ID"),
  now: z.date().describe("发帖时间"),
  parent: z.number().describe("串ID"),
  fid: fidSchema,
  img: z.string().describe("图片文件名"),
  ext: z.string().describe("文件扩展名"),
});

const notStartsWithFilter = defineTypedFn({
  name: "notStartsWith",
  define: z.function().args(z.string(), z.coerce.string()).returns(z.boolean()),
  // Just a placeholder since we don't need filter data at frontend.
  implement: () => false,
});

const filterPriority = [
  "contains",
  "notContains",
  "startsWith",
  "notStartsWith",
];

export const filterFnList: FnSchema[] = [
  ...presetFilter.filter((fn) => fn.name !== "endsWith"),
  notStartsWithFilter,
].sort((a, b) => {
  const indexA = filterPriority.indexOf(a.name);
  const indexB = filterPriority.indexOf(b.name);
  return (
    (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB)
  );
});

const locale: Record<string, string> = {
  ...zhCN,
  startsWith: "以...开始",
  notStartsWith: "不以...开始",
  ...Object.fromEntries(forumData.map((f) => [f.id, f.name])),
  id: "帖子ID",
  fid: "版块ID",
  name: "名称",
  title: "帖子标题",
  content: "帖子内容",
  img: "图片文件名",
  ext: "文件扩展名",
  now: "发帖时间",
  type: "帖子类型",
  userid: "饼干",
  parent: "串ID",
  thread: "串首",
  reply: "回复",
};

export const getLocaleText = (key: string): string => {
  if (!(key in locale)) return key;
  return locale[key];
};
