import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
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
import { GetThreads, ParseThreads } from "../functions/bbs";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { TopJumpArea } from "./components/TopJump";
import findThreads from "../functions/findThreads";
import MultiParser from "./components/MultiParser";
import { FaFileImage } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { create } from "zustand";

interface ThreadsStateType {
  threadsList: {
    [k: string]: ThreadType[] | undefined;
  };
  reloadList: {
    [k: string]: boolean;
  };
  setThreadsList: (name: string, list: ThreadType[]) => void;
  setReloadList: (name: string, flag: boolean) => void;
}
export const useThreadsState = create<ThreadsStateType>((set) => ({
  threadsList: {},
  reloadList: {},
  setThreadsList(name, list) {
    set((state) => {
      return {
        threadsList: { ...state.threadsList, [name]: list },
        reloadList: { ...state.reloadList, [name]: false },
      };
    });
  },
  setReloadList(name, flag) {
    set((state) => {
      return {
        reloadList: { ...state.reloadList, [name]: flag },
      };
    });
  },
}));

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

const threadLabeledList: {
  name: string;
  label?: string;
  order?: OrderByType;
}[] = [
  { name: "", label: "メイン" },
  { name: "old", label: "過去", order: "asc" },
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
  const formref = useRef<HTMLFormElement>(null);
  const currentName = useParams().name ?? "";
  const { setReloadList } = useThreadsState();
  return (
    <form
      id="post_form"
      method="post"
      className="post"
      action="/bbs/api/send/post/"
      encType="multipart/form-data"
      ref={formref}
      onSubmit={(e) => {
        if (formref.current) {
          e.preventDefault();
          const fd = new FormData(formref.current);
          axios.postForm(formref.current.action, fd).then(() => {
            setReloadList(currentName, true);
            formref.current?.reset();
          });
        }
      }}
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
        <div className="up list">
          <div className="up_cancel">×</div>
          <div className="up_file"></div>
        </div>
      </div>
      <input type="hidden" name="update_target" />
      <div className="list">
        <div className="right buttons">
          <button
            id="file_selector_button"
            type="button"
            title="ファイル選択"
            disabled
          >
            <FaFileImage />
          </button>
        </div>
        <textarea title="本文" name="text" />
        <div className="right buttons">
          <button type="submit" title="送信">
            <IoSend />
          </button>
        </div>
      </div>
    </form>
  );
}

function SearchArea({ data }: { data: ThreadsDataType }) {
  const [search, setSearch] = useSearchParams();
  const refInput = useRef<HTMLInputElement>(null);
  const p = useMemo(() => Number(search.get("p") ?? 1), [search]);
  const q = useMemo(() => search.get("q") ?? "", [search]);
  const maxPage = useMemo(
    () => (data.take ? Math.ceil(data.length / data.take) : 1),
    [data]
  );
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
  useEffect(() => {
    if (refInput.current) refInput.current.value = q;
  }, [q]);
  return (
    <div className="list">
      <form
        id="form_search_main"
        method="get"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          const nq = (e.target as HTMLFormElement).q.value;
          if (nq !== q) {
            if (nq) setSearch({ q: nq });
            else setSearch();
          }
        }}
      >
        <input
          type="search"
          title="検索"
          name="q"
          ref={refInput}
          placeholder="キーワード検索"
          defaultValue={q}
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
  );
}

function BBSPage() {
  const currentName = useParams().name ?? "";
  const current = threadLabeledList.find(({ name }) => name == currentName);
  const [search, setSearch] = useSearchParams();
  const { threadsList, setThreadsList, reloadList } = useThreadsState();
  const threads = useMemo(
    () => threadsList[currentName] ?? [],
    [threadsList, currentName]
  );
  useEffect(() => {
    if (!threadsList[currentName] || reloadList[currentName]) {
      axios
        .get("/bbs/api/get/threads/" + (currentName ? currentName + "/" : ""))
        .then((r) => {
          const rawData: ThreadsRawType[] = r.data;
          setThreadsList(currentName, ParseThreads(rawData));
        });
    }
  }, [currentName, reloadList]);
  const take = useMemo(() => {
    let v = search.get("take");
    return v ? Number(v) : 100;
  }, [search]);
  const page = useMemo(() => {
    let v = search.get("p");
    return v ? Number(v) : 1;
  }, [search]);
  const q = useMemo(() => {
    let v = search.get("q");
    return v ? v : undefined;
  }, [search]);
  const order = useMemo(() => {
    let v = search.get("order") as OrderByType;
    return v ? v : current?.order;
  }, [search, current]);
  const id = useMemo(() => {
    let v = search.get("id");
    return v ? Number(v) : undefined;
  }, [search]);
  const threadsObject = useMemo(() => {
    return findThreads({ threads: threads.concat(), take, page, q, order, id });
  }, [threads, search]);
  return (
    <>
      <div className="bbs">
        <div>
          <header>
            <div className="search">
              <ThreadListArea />
              <SearchArea data={threadsObject} />
            </div>
            <PostForm />
          </header>
          <main className="thread">
            {threadsObject.threads.map((v, i) => (
              <div className="item" data-id={v.id} key={i}>
                <div className="body">
                  {v.text ? <MultiParser>{v.text}</MultiParser> : null}
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
      <TopJumpArea />
    </>
  );
}
