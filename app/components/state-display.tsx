"use client";

import { useState, useEffect, Fragment } from "react";

type Stats = {
  db_stats?: {
    numberOfDocuments?: number;
    isIndexing?: boolean;
  };
  last_indexed_at?: string | number;
  max_id?: string | number;
};

function formatLastIndexedAt(value: Stats["last_indexed_at"]) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("zh-CN");
}

const StatsDisplay = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) {
          throw new Error(`统计接口返回 ${response.status}`);
        }
        const data = (await response.json()) as Stats;
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>统计数据加载中…</div>;
  if (error) return <div>错误: {error}</div>;
  if (!stats) return <div>无数据</div>;

  const lastIndexedAt = formatLastIndexedAt(stats.last_indexed_at);
  const recordCount = stats.db_stats?.numberOfDocuments ?? 0;
  const indexStatus = stats.db_stats?.isIndexing ? "索引中" : "无进行中的索引";

  return (
    <Fragment>
      总 {recordCount} 条记录，{indexStatus}
      {stats.max_id !== undefined && (
        <>
          <br />
          {lastIndexedAt ? `最后索引于 ${lastIndexedAt}，` : "最新索引"} id{" "}
          {stats.max_id}
        </>
      )}
    </Fragment>
  );
};

export default StatsDisplay;
