"use client";

import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorView } from "@codemirror/view";

export interface Props {
  value?: string;
  onChange?: (value: string, viewUpdate: any) => void;
}

export default function AdvancedSearchInput(props: Props) {
  /*
  id: int, 回复 ID
  fid: int, 版块 ID
  ext: str, 文件扩展名
  now: int, 发帖时间，以秒计
  name: str, 名称
  title: str, 帖子标题
  content: str, 帖子内容
  parent: int, 串 ID
  type: str, 帖子类型
  userid: str, 饼干
  */
  const TABLES = [
    "id",
    "fid",
    "ext",
    "now",
    "name",
    "title",
    "content",
    "parent",
    "type",
    "userid",
  ].map((label) => ({ label }));
  const [value, setValue] = React.useState(
    props.value ??
      `讨论串 (fid = 4 AND type = "thread" AND now >= sec(2025-1-1))`
  );
  const onChange = React.useCallback((val: string, viewUpdate: any) => {
    console.log("val:", val);
    setValue(val);
    props.onChange && props.onChange(val, viewUpdate);
  }, []);
  return (
    <CodeMirror
      className="rounded-base border-2 font-base border-border bg-bw px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      value={value}
      minHeight="100px"
      maxHeight="400px"
      // theme={gruvboxLight}
      extensions={[
        sql({
          tables: TABLES,
        }),
        EditorView.lineWrapping,
      ]}
      onChange={onChange}
      style={{
        fontSize: "1.32em",
      }}
    />
  );
}
