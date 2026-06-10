import { Suspense } from "react";
import Search from "./components/search";
import LoadingSpinner from "./components/loading-spinner";
import SearchAnimation from "./components/search-animation";
import ManualDialog from "./components/manual-dialog";
import StateDisplay from "./components/state-display";

/*
nmbxd1.com 的第三方搜索。
支持全文搜索、发帖时间排序和高级筛选。
*/

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-bg">
      <div className="z-10 w-full items-center justify-between px-4 sm:px-8 md:px-16 lg:px-24">
        <h1 className="mb-4 font-black text-4xl font-heading text-text shadow-shadow text-center py-8">
          <img
            src="/neosearch.svg"
            alt="NeoSearch"
            className="w-24 h-24 inline-block mr-2 absolute translate-x-32 font-bold"
          />
          Island Search
          <div className="ml-auto block md:hidden">
            <ManualDialog />
          </div>
        </h1>
        <section className="max-w-4xl w-full m-auto">
          <Suspense fallback={<LoadingSpinner />}>
            <Search />
          </Suspense>
        </section>
        <SearchAnimation />
      </div>
      <div className="text-center text-sm text-text mb-4">
        <StateDisplay />
        <br />
        nmbxd1.com 的第三方搜索 © 2026.
        <br />
        Hosted on Vercel. 第三方搜索，数据来源{" "}
        <a
          href="https://www.nmbxd1.com"
          className="text-primary"
        >
          nmbxd1.com
        </a>
      </div>
    </main>
  );
}
