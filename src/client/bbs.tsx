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
import { FaCaretDown, FaCaretUp, FaTimes } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { create } from "zustand";
import { useHotkeys } from "react-hotkeys-hook";
import { TbReload } from "react-icons/tb";

interface ThreadsStateType {
  threadsList: {
    [k: string]: ThreadType[] | null | undefined;
  };
  reloadList: {
    [k: string]: boolean;
  };
  setThreadsList: (name: string, list: ThreadType[] | null) => void;
  setReloadList: (name: string, flag: boolean) => void;
  edit?: number;
  setEdit: (edit?: number) => void;
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
    set((state) => ({
      reloadList: { ...state.reloadList, [name]: flag },
    }));
  },
  setEdit(edit) {
    set(() => ({ edit }));
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
  postable?: boolean;
}[] = [
  { name: "", label: "メイン" },
  { name: "old", label: "過去", order: "asc", postable: false },
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
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentName = useParams().name ?? "";
  const { threadsList, setReloadList, edit, setEdit } = useThreadsState();
  const currentThread = threadsList[currentName];
  const editThread = useMemo(
    () =>
      currentThread && typeof edit === "number"
        ? currentThread.find(({ id }) => edit === id)
        : undefined,
    [edit, currentThread]
  );
  useEffect(() => {
    if (formRef.current) {
      const form = formRef.current;
      if (form.edit.value !== "" && !editThread) {
        form.edit.value = "";
        form.reset();
      } else if (editThread) {
        form.edit.value = editThread.id;
        form.text.value = editThread.text ?? "";
        form.text.focus();
      }
    }
  }, [editThread]);
  function Submit() {
    if (formRef.current) {
      const form = formRef.current;
      const fd = new FormData(form);
      axios.postForm(form.action, fd).then(() => {
        setReloadList(currentName, true);
        setEdit();
        form.reset();
      });
    }
  }
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === textareaRef.current) {
        textareaRef.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["TEXTAREA"] }
  );
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (document.activeElement === textareaRef.current) {
        e.preventDefault();
        Submit();
        textareaRef.current?.blur();
      }
    },
    { enableOnFormTags: ["TEXTAREA"] }
  );
  useHotkeys("n", (e) => {
    textareaRef.current?.focus();
    e.preventDefault();
  });

  return (
    <form
      id="post_form"
      method="post"
      className="post"
      action={"/bbs/api/send/post/" + (currentName ? currentName + "/" : "")}
      encType="multipart/form-data"
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        Submit();
      }}
    >
      <input type="hidden" name="edit" />
      <div className="list">
        <textarea title="本文" name="text" ref={textareaRef} />
        <div>
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
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === refInput.current) {
        refInput.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT"] }
  );
  useHotkeys("slash", (e) => {
    refInput.current?.focus();
    e.preventDefault();
  });
  useHotkeys("j", (e) => {
    paging(-1);
    e.preventDefault();
  });
  useHotkeys("k", (e) => {
    paging(1);
    e.preventDefault();
  });
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
  const {
    threadsList,
    setThreadsList,
    reloadList,
    setReloadList,
    edit,
    setEdit,
  } = useThreadsState();
  useEffect(() => {
    setEdit();
  }, [currentName]);
  const threads = threadsList[currentName];
  useEffect(() => {
    if (
      typeof threadsList[currentName] === "undefined" ||
      reloadList[currentName]
    ) {
      axios
        .get("/bbs/api/get/threads/" + (currentName ? currentName + "/" : ""))
        .then((r) => {
          const rawData: ThreadsRawType[] = r.data;
          setThreadsList(currentName, ParseThreads(rawData));
        })
        .catch(() => {
          setThreadsList(currentName, null);
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
    return findThreads({
      threads: (threads ?? []).concat(),
      take,
      page,
      q,
      order,
      id,
    });
  }, [threads, search]);
  return (
    <>
      <div className={"bbs" + (current?.postable ?? true ? " postable" : "")}>
        <header>
          <div className="search">
            <button
              type="button"
              title="リロード"
              onClick={() => {
                setReloadList(currentName, true);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                location.reload();
              }}
            >
              <TbReload />
            </button>
            <ThreadListArea />
            <SearchArea data={threadsObject} />
          </div>
          <PostForm />
        </header>
        <main className="thread">
          {typeof threads === "undefined"
            ? "読み込み中…"
            : threadsObject.threads.map((v, i) => {
                const isEdit = edit === v.id;
                return (
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
                      <button
                        type="button"
                        className="delete"
                        title="削除する"
                        onClick={() => {
                          if (
                            confirm(
                              "本当に削除しますか？\nid:" + v.id + " " + v.text
                            )
                          ) {
                            const fd = new FormData();
                            fd.append("id", v.id.toString());
                            axios
                              .delete(
                                "/bbs/api/send/post/" +
                                  (currentName ? currentName + "/" : ""),
                                { data: fd }
                              )
                              .then(() => {
                                setReloadList(currentName, true);
                              });
                          }
                        }}
                      >
                        <FaTimes />
                      </button>
                      <button
                        type="button"
                        className="edit"
                        title={isEdit ? "編集解除" : "編集する"}
                        onClick={(e) => {
                          if (isEdit) setEdit();
                          else setEdit(v.id);
                        }}
                      >
                        {isEdit ? <FaCaretUp /> : <FaCaretDown />}
                      </button>
                    </div>
                  </div>
                );
              })}
        </main>
      </div>
      <TopJumpArea />
    </>
  );
}
