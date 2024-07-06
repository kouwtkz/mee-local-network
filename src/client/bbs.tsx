import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { GetThreads, ParseThreads } from "../functions/bbs";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";

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
  { name: "old", label: "過去" },
];
function ThreadListArea() {
  const currentName = useParams().name ?? "";
  const current = threadLabeledList.find(({ name }) => name == currentName);
  const list = threadLabeledList.filter(({ name }) => name !== currentName);
  return (
    <div className="threadList">
      <span>【{current?.label}】</span>
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

function ScrollTopArea() {
  const ref = useRef<HTMLButtonElement>(null);
  var scrTop = 400;
  function handleScroll() {
    if (ref.current)
      if (window.scrollY > scrTop) {
        ref.current.classList.remove("hide");
      } else {
        ref.current.classList.add("hide");
      }
  }
  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrTop]);
  return (
    <button
      type="button"
      className="jump"
      ref={ref}
      onClick={() => {
        scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      ▲
    </button>
  );
}

function BBSPage() {
  const currentName = useParams().name ?? "";
  const [search, setSearch] = useSearchParams();
  const threadsList = useRef<{
    [k: string]: ThreadType[] | undefined;
  }>({});
  const [loaded, setLoaded] = useState<string[]>([]);
  const threads = useMemo(
    () => threadsList.current[currentName] ?? [],
    [loaded, currentName]
  );
  useEffect(() => {
    if (!threadsList.current[currentName]) {
      const filename = (currentName ? currentName + "_" : "") + "threads.json";
      axios.get("/bbs/api/get/threads/" + filename).then((r) => {
        const rawData: ThreadsRawType[] = r.data;
        threadsList.current[currentName] = ParseThreads(rawData);
        setLoaded(loaded.concat(currentName));
      });
    }
  }, [currentName]);
  const threadsObject = useMemo(() => {
    return GetThreads({
      limit: 100,
      order: "desc",
      ...Object.fromEntries(search),
      threads: threads.concat(),
    });
  }, [threads, search]);
  const maxPage = useMemo(
    () =>
      threadsObject.limit
        ? Math.ceil(threadsObject.length / threadsObject.limit)
        : 1,
    [threadsObject]
  );
  const p = useMemo(() => Number(search.get("p") ?? 1), [search]);
  function paging(go: number) {
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
        <ScrollTopArea />
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
              title="前のページに戻る"
              disabled={p <= 1}
              onClick={() => paging(-1)}
              onContextMenu={(e) => {
                e.preventDefault();
                paging(-1e6);
              }}
            >
              <MdArrowBackIosNew />
            </button>
            <button
              type="button"
              className="right"
              title="次のページに進む"
              disabled={p >= maxPage}
              onClick={() => paging(1)}
              onContextMenu={(e) => {
                e.preventDefault();
                paging(1e6);
              }}
            >
              <MdArrowForwardIos />
            </button>
          </div>
        </div>
        {/* <PostForm /> */}
        <main className="thread">
          {threadsObject.threads.map((v, i) => (
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
