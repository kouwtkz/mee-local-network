import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createSearchParams,
  Link,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ErrorPage from "./routes/ErrorPage";
import { FormatDate } from "../functions/DateFunctions";
import { Base } from "./routes/Root";
import { parse } from "marked";
import HTMLReactParser from "html-react-parser/lib/index";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider
    router={createBrowserRouter([
      {
        path: "bbs",
        element: (
          <>
            <ScrollRestoration />
            <Base>
              <Outlet />
            </Base>
          </>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <BBSPage />,
          },
          {
            path: ":name",
            index: true,
            element: <BBSPage />,
          },
        ],
      },
    ])}
  />
);

const threadLabeledList: { name: string; label?: string }[] = [
  { name: "", label: "メイン" },
  { name: "old", label: "アーカイブ" },
];
function ThreadListArea() {
  const currentName = useParams().name ?? "";
  const current = threadLabeledList.find(({ name }) => name == currentName);
  const list = threadLabeledList.filter(({ name }) => name !== currentName);
  return (
    <div className="threadList">
      <span>
        <span>現在: </span>
        <span>{current?.label}</span>
      </span>
      {list.map(({ name, label }, i) => {
        return (
          <Link key={i} to={"/bbs" + (name ? "/" + name : "") + "/"}>
            &gt;{label}
          </Link>
        );
      })}
    </div>
  );
}

function PostForm() {
  return (
    <form
      id="post_form"
      method="post"
      action="/bbs/"
      encType="multipart/form-data"
    >
      <div className="upload">
        <div className="file_input">
          <input
            id="file_selector"
            title="アップロードするファイル"
            name="uploadedfile"
            type="file"
            accept="image/*, video/*, audio/*, text/*, application/*"
          />
        </div>
        <div className="up_list">
          <div className="up_cancel">×</div>
          <div className="up_file"></div>
        </div>
      </div>
      <input type="hidden" name="update_target" />
      <div className="write_space">
        <div className="right buttons">
          <input
            id="file_selector_button"
            type="button"
            value="F"
            className="button unselectable"
          />
        </div>
        <textarea title="本文" name="text" />
        <div className="right buttons">
          <input type="submit" value="▷" className="button" />
        </div>
      </div>
    </form>
  );
}

function BBSPage() {
  const [search, setSearch] = useSearchParams();
  const [threadsData, setThreadsData] = useState<ThreadsDataType>({
    threads: [],
    length: 0,
    limit: 0,
  });
  const name = useParams().name;
  useEffect(() => {
    const callSearch = createSearchParams({
      order: "desc",
      ...Object.fromEntries(search),
    });
    const filename = (name ? name + "_" : "") + "threads.json";
    axios
      .get("/bbs/api/get/threads/" + filename + "?" + callSearch.toString())
      .then((r) => {
        const rawData: ThreadsResponseType = r.data;
        const data: ThreadsDataType = {
          ...rawData,
          threads: rawData.threads.map(({ createdAt, updatedAt, ...args }) => ({
            date: createdAt ? new Date(createdAt) : undefined,
            ...args,
          })),
        };
        setThreadsData(data);
      });
  }, [name, search]);
  function paging(go: number) {
    const p = Number(search.get("p") ?? 1);
    const maxPage = Math.ceil(threadsData.length / threadsData.limit);
    let np = p + go;
    if (np > maxPage) np = maxPage;
    if (np < 1) np = 1;
    if (np !== p) {
      const searchObject: { [k: string]: string } = {
        ...Object.fromEntries(search),
        p: np.toString(),
      };
      if (searchObject.p === "1") delete searchObject.p;
      setSearch(searchObject, { preventScrollReset: false });
    }
  }
  return (
    <div className="bbs">
      <div>
        <button
          type="button"
          className="jump"
          onClick={() => {
            scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          ▲
        </button>
        <div className="search">
          <ThreadListArea />
          <form
            id="form_search_main"
            method="get"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (e.target as HTMLFormElement).q.value;
              if (q !== (search.get("q") ?? "")) {
                if (q) setSearch({ q });
                else setSearch();
              }
            }}
          >
            <input
              type="text"
              title="検索"
              name="q"
              placeholder="キーワード検索"
              defaultValue={search.get("q") ?? ""}
            />
            <button type="submit" className="submit button">
              検索
            </button>
          </form>
          <div className="paging">
            <button
              type="button"
              className="left"
              onClick={() => paging(-1)}
              onContextMenu={(e) => {
                e.preventDefault();
                paging(-1e6);
              }}
            >
              ＜
            </button>
            <button
              type="button"
              className="right"
              onClick={() => paging(1)}
              onContextMenu={(e) => {
                e.preventDefault();
                paging(1e6);
              }}
            >
              ＞
            </button>
          </div>
        </div>
        {/* <PostForm /> */}
        <main className="thread">
          {threadsData.threads.map((v, i) => (
            <div className="item" data-id={v.id} key={i}>
              <div className="body">
                {v.text
                  ? HTMLReactParser(parse(v.text, { async: false }) as string)
                  : null}
              </div>
              <div className="info">
                <span className="num">{v.id}: </span>
                <Link to={"?id=" + v.id}>
                  <span className="date">
                    {v.date ? FormatDate(v.date) : null}
                  </span>
                </Link>
                {/* <button type="button" onClick={() => {}}>
                  ×
                </button>
                <button
                  type="button"
                  className="update_calling_elem"
                  onClick={() => {}}
                >
                  ▽
                </button> */}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
