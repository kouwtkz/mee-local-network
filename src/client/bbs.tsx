import axios, { AxiosError } from "axios";
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
import { FaCaretDown, FaCaretUp, FaHome, FaTimes } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { create } from "zustand";
import { useHotkeys } from "react-hotkeys-hook";
import { TbPencil, TbPencilCancel, TbReload } from "react-icons/tb";
import { getRedirectUrl } from "../functions/redirectUrl";
import { ThemeStateClass } from "./state/ThemeSetter";
import { CgDarkMode, CgMoon, CgSun } from "react-icons/cg";

export const DarkThemeState = new ThemeStateClass("darktheme", [
  "light",
  "dark",
]);

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
  cursor: number;
  setCursor: (cursor: number) => void;
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
  cursor: 0,
  setCursor(cursor) {
    set(() => ({ cursor }));
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
  const { threadsList, setReloadList, edit, setEdit, setCursor } =
    useThreadsState();
  const currentThread = threadsList[currentName];
  const [search, setSearch] = useSearchParams();
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
        if (edit === undefined) {
          if (search.has("id")) {
            setCursor(0);
            setSearch();
          } else {
            const hasP = search.has("p");
            const obj = Object.fromEntries(search);
            if (hasP) {
              delete obj.p;
              setSearch(obj);
            } else {
              document.body.scrollTo({ top: 0 });
              setCursor(0);
            }
          }
        }
        setReloadList(currentName, true);
        setEdit();
        form.reset();
      });
    }
  }
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (document.activeElement === textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.blur();
        Submit();
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
      <textarea
        title="本文"
        name="text"
        ref={textareaRef}
        onKeyDown={(e) => {
          if (e.code === "Escape") {
            if (edit === undefined) textareaRef.current?.blur();
            else {
              const ti = document.querySelector(
                `.thread .item[data-id="${edit}"`
              ) as HTMLElement | null;
              ti?.focus();
            }
            e.preventDefault();
          }
        }}
      />
      <div>
        <button type="submit" title="送信">
          <IoSend />
        </button>
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
  useHotkeys("o", (e) => {
    paging(-1);
    e.preventDefault();
  });
  useHotkeys("p", (e) => {
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
        className="search"
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

function DarkThemeButton() {
  const { theme: darktheme, next } = DarkThemeState.use();
  return (
    <button type="button" title="ダークテーマ切替" onClick={next}>
      {darktheme === "light" ? (
        <CgSun />
      ) : darktheme === "dark" ? (
        <CgMoon />
      ) : (
        <CgDarkMode />
      )}
    </button>
  );
}

function OptionButtons() {
  const currentName = useParams().name ?? "";
  const { setReloadList } = useThreadsState();
  const [isOpen, setOpen] = useState(false);
  return (
    <div className={"buttons" + (isOpen ? " opened" : "")}>
      <button
        type="button"
        className="opener"
        title="展開"
        onClick={() => {
          setOpen(!isOpen);
        }}
      >
        {isOpen ? <FaCaretUp /> : <FaCaretDown />}
      </button>
      <div className="list">
        <a className="button" title="ホームへ戻る" href="/">
          <FaHome />
        </a>
        <DarkThemeButton />
        <button
          type="button"
          title="読み込み"
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
      </div>
    </div>
  );
}

function BBSPage() {
  const currentName = useParams().name ?? "";
  const current = threadLabeledList.find(({ name }) => name == currentName);
  const refMain = useRef<HTMLElement>(null);
  const [search, setSearch] = useSearchParams();
  const {
    threadsList,
    setThreadsList,
    reloadList,
    setReloadList,
    edit,
    setEdit,
    cursor,
    setCursor,
  } = useThreadsState();
  useEffect(() => {
    setEdit();
  }, [currentName]);
  useHotkeys("period, NumpadDecimal", (e) => {
    setReloadList(currentName, true);
    e.preventDefault();
  });
  function findParentItem(e: Element | null) {
    if (e === null || e.classList.contains("item")) return e;
    const p = e ? e.parentElement : e;
    if (!refMain.current?.contains(e) || !p) return null;
    else return findParentItem(p);
  }
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
        .catch((r: AxiosError) => {
          if (r.response?.status === 401) {
            location.href = getRedirectUrl(location.href);
          } else setThreadsList(currentName, null);
        });
    }
  }, [currentName, reloadList]);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/bbs/sw.js").then((reg) => {
        // console.log("SW registered.", reg);
      });
    }
  }, []);
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
  const [kp, setKp] = useState(-1);
  useEffect(() => {
    if (id === undefined) {
      if (kp !== page) {
        setKp(page);
        setCursor(0);
        const ti = document.querySelector(
          ".thread .item[tabindex]"
        ) as HTMLElement | null;
        if (ti) {
          ti.focus();
          ti.blur();
        }
      } else {
        const ti = document.querySelector(
          `.thread .item[data-id="${cursor}"`
        ) as HTMLElement | null;
        ti?.focus();
      }
    }
  }, [id, page]);
  useEffect(() => {
    setKp(page);
  }, [currentName]);
  const threads = threadsList[currentName];
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
  function cursoring(n: number) {
    let current: HTMLElement | null = null;
    const flag1 = refMain.current?.contains(document.activeElement);
    if (flag1) current = findParentItem(document.activeElement) as any;
    if (flag1 && current) {
      let nextTarget: HTMLElement | null = current;
      if (n < 0) {
        for (var i = 0; i > n; i--) {
          const t = nextTarget?.previousElementSibling as HTMLElement | null;
          nextTarget = t ?? nextTarget;
          if (t === null && document.body.scrollTop !== 0)
            document.body.scrollTo({ top: 0 });
        }
      } else if (n > 0) {
        for (var i = 0; i < n; i++) {
          const t = nextTarget?.nextElementSibling as HTMLElement | null;
          nextTarget = t ?? nextTarget;
        }
      }
      nextTarget?.focus();
    } else {
      if (cursor)
        current = document.querySelector(`.thread .item[data-id="${cursor}"`);
      if (!current)
        current = document.querySelector(".thread .item[tabindex]") as any;
      current?.focus();
    }
  }
  useHotkeys("j", (e) => {
    cursoring(-1);
    e.preventDefault();
  });
  useHotkeys("k", (e) => {
    cursoring(1);
    e.preventDefault();
  });
  useHotkeys("escape", () => {
    if (document.activeElement) (document.activeElement as HTMLElement).blur();
  });

  function toggleEdit(id: number, isEdit: boolean) {
    if (isEdit) setEdit();
    else setEdit(id);
  }
  return (
    <>
      {DarkThemeState.State()}
      <div className={"bbs" + (current?.postable ?? true ? " postable" : "")}>
        <header>
          <OptionButtons />
          <div className="search">
            <ThreadListArea />
            <SearchArea data={threadsObject} />
          </div>
        </header>
        <div className="under">
          <PostForm />
        </div>
        <main className="thread" ref={refMain}>
          {typeof threads === "undefined"
            ? "読み込み中…"
            : threadsObject.threads.map((v, i) => {
                const isEdit = edit === v.id;
                return (
                  <div
                    className={"item" + (isEdit ? " isEdit" : "")}
                    tabIndex={-1}
                    data-id={v.id}
                    onKeyDown={(e) => {
                      if (e.target === e.currentTarget && e.code === "Enter") {
                        setSearch({ id: v.id.toString() });
                        e.preventDefault();
                      } else if (e.code === "F2") {
                        toggleEdit(v.id, isEdit);
                        e.preventDefault();
                      }
                    }}
                    onFocus={() => {
                      setCursor(v.id);
                    }}
                    key={i}
                  >
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
                        onClick={() => {
                          toggleEdit(v.id, isEdit);
                        }}
                      >
                        {isEdit ? <TbPencilCancel /> : <TbPencil />}
                      </button>
                    </div>
                  </div>
                );
              })}
        </main>
        <TopJumpArea />
      </div>
    </>
  );
}
