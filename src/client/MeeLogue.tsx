import axios, { AxiosError } from "axios";
import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ErrorPage from "@/routes/ErrorPage";
import { FormatDate } from "#/functions/DateFunctions";
import { Base } from "@/routes/Root";
import { ParseThreads } from "#/functions/MeeLogue";
import { TopJumpArea } from "@/components/TopJump";
import findThreads from "#/functions/findThreads";
import { MultiParser } from "@/components/parse/MultiParser";
import { FaHome, FaPen, FaTimes } from "react-icons/fa";
import { IoSend } from "react-icons/io5";
import { create } from "zustand";
import { useHotkeys } from "react-hotkeys-hook";
import { TbEraser, TbPencil, TbPencilCancel } from "react-icons/tb";
import { getRedirectUrl } from "#/functions/redirectUrl";
import { DarkThemeState } from "@/theme";
import { SearchArea } from "@/components/Search";
import { BackUrlButton, DarkThemeButton } from "@/components/Buttons";
import { Loading } from "#/layout/Loading";
import { MobileFold } from "@/components/MobileFold";
import { ReloadButton } from "@/components/Reload";
import { useCookies } from "react-cookie";
import { FieldValues, useForm } from "react-hook-form";
import SetRegister from "@/components/hook/SetRegister";
import {
  PostEditSelectDecoration,
  PostEditSelectInsert,
  PostEditSelectMedia,
} from "./components/dropdown/PostEditSelect";
import {
  MdOutlineAddLink,
  MdOutlineEditNote,
  MdOutlineFactCheck,
  MdOutlinePlaylistAdd,
  MdOutlinePostAdd,
} from "react-icons/md";
import { atom, useAtom } from "jotai";
import { pageIsCompleteAtom, siteIsFirstAtom } from "./state/DataState";
import { PostTextarea, usePreviewMode } from "./components/parse/PostTextarea";
import { scrollLock } from "@/components/hook/ScrollLock";

const root = "/logue/";
const cacheName = "logue-data";
const cacheSessionName = "logue-data-session";

interface PostsStateType {
  postsList: {
    [k: string]: MeeLoguePostType[] | null | undefined;
  };
  reloadList: {
    [k: string]: boolean;
  };
  setPostsList: (name: string, list: MeeLoguePostType[] | null) => void;
  setReloadList: (name: string, flag: boolean) => void;
  edit?: number;
  setEdit: (edit?: number) => void;
  cursor: number;
  setCursor: (cursor: number) => void;
  isSet: boolean;
  setIsSet: (value: boolean) => void;
}
export const usePostsState = create<PostsStateType>((set) => ({
  postsList: {},
  reloadList: {},
  setPostsList(name, list) {
    set((state) => {
      return {
        postsList: { ...state.postsList, [name]: list },
        reloadList: { ...state.reloadList, [name]: false },
        isSet: true,
      };
    });
  },
  setReloadList(name, flag) {
    set((state) => ({
      reloadList: { ...state.reloadList, [name]: flag },
    }));
  },
  setEdit(edit) {
    set({ edit });
  },
  cursor: 0,
  setCursor(cursor) {
    set({ cursor });
  },
  isSet: false,
  setIsSet(isSet) {
    set({ isSet });
  },
}));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider
    router={createBrowserRouter([
      {
        path: root,
        element: (
          <>
            <DarkThemeState />
            <Base>
              <Outlet />
            </Base>
          </>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <LoguePage />,
          },
          {
            path: ":name",
            index: true,
            element: <LoguePage />,
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
  const { setReloadList } = usePostsState();
  return (
    <MobileFold wide={true}>
      <ReloadButton
        className="link"
        onClick={() => {
          setReloadList(currentName, true);
        }}
        cacheSession={cacheSessionName}
        cacheOptions={{ path: root }}
      />
      <span>【{current?.label}】</span>
      {list.map(({ name, label }, i) => {
        return (
          <Link key={i} to={"/logue" + (name ? "/" + name : "") + "/"}>
            &gt;{label}
          </Link>
        );
      })}
    </MobileFold>
  );
}

const isSendingAtom = atom(false);
const defaultValues = { text: "", edit: "" };
function PostForm() {
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentName = useParams().name ?? "";
  const { postsList, setReloadList, edit, setEdit, setCursor } =
    usePostsState();
  const currentThread = postsList[currentName];
  const [searchParams, setSearch] = useSearchParams();
  const { hash, state, pathname, search } = useLocation();
  const [isSending, setIsSending] = useAtom(isSendingAtom);
  const isBusy = useMemo(() => isSending, [isSending]);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<FieldValues>({ defaultValues });
  const { previewMode, togglePreviewMode } = usePreviewMode();
  const nav = useNavigate();
  function setShow(v: boolean) {
    if (v)
      nav(
        { pathname, search, hash: "post" },
        { preventScrollReset: true, state: { show: true } }
      );
    else if (state?.show) nav(-1);
    else
      nav(
        { pathname, search },
        { preventScrollReset: true, state: { show: true } }
      );
  }
  const show = useMemo(
    function () {
      return hash === "#post";
    },
    [hash]
  );
  useEffect(() => {
    scrollLock(show);
  }, [show]);
  const editThread = useMemo(
    () =>
      currentThread && typeof edit === "number"
        ? currentThread.find(({ id }) => edit === id)
        : undefined,
    [edit, currentThread]
  );
  useEffect(() => {
    if (editThread) {
      reset({ edit: editThread.id, text: editThread.text ?? "" });
      textareaRef.current?.focus();
    } else {
      reset(defaultValues);
    }
  }, [editThread]);
  function Submit() {
    if (formRef.current && !isBusy && isDirty) {
      setIsSending(true);
      const form = formRef.current;
      const fd = new FormData(form);
      axios
        .postForm(form.action, fd)
        .then(() => {
          if (edit === undefined) {
            if (searchParams.has("id")) {
              setCursor(0);
              setSearch();
            } else {
              const hasP = searchParams.has("p");
              const obj = Object.fromEntries(searchParams);
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
          setShow(false);
          reset();
        })
        .finally(() => {
          setIsSending(false);
        });
    }
  }
  useHotkeys(
    "ctrl+enter",
    (e) => {
      if (document.activeElement === textareaRef.current) {
        e.preventDefault();
        Submit();
      }
    },
    { enableOnFormTags: ["TEXTAREA"] }
  );
  useHotkeys("n", (e) => {
    setShow(true);
    e.preventDefault();
  });
  useEffect(() => {
    if (typeof edit !== "undefined") setShow(true);
  }, [edit]);
  useEffect(() => {
    const modalPostClass = "view-modal-post";
    if (show) {
      document.body.classList.add(modalPostClass);
      textareaRef.current?.focus();
    } else {
      document.body.classList.remove(modalPostClass);
    }
  }, [show]);
  const shared_intent = useMemo(() => {
    const list = ["name", "description", "link"]
      .map((v) => searchParams.get(v) ?? "")
      .filter((v) => v);
    return list.join("\n");
  }, [searchParams]);
  const shared_cursor_top = useMemo(() => {
    return searchParams.has("link");
  }, [searchParams]);
  useEffect(() => {
    if (formRef.current && shared_intent) {
      const form = formRef.current;
      if (shared_cursor_top) {
        form.text.value = "\n" + shared_intent;
        textareaRef.current?.setSelectionRange(0, 0);
      } else {
        form.text.value = shared_intent + "\n";
      }
      setShow(true);
      setSearch({}, { replace: true });
    }
  }, [shared_intent]);
  useHotkeys(
    "escape",
    (e) => {
      setShow(false);
      if (edit !== undefined) {
        const ti = document.querySelector(
          `main.list .item[data-id="${edit}"`
        ) as HTMLElement | null;
        ti?.focus();
      }
      e.preventDefault();
    },
    { enableOnFormTags: ["TEXTAREA"] }
  );

  return (
    <>
      <button
        type="button"
        title="投稿する"
        className="post"
        onClick={() => {
          setShow(true);
        }}
      >
        <FaPen />
      </button>
      <div
        className="modal post"
        hidden={!show}
        ref={modalRef}
        onClick={(e) => {
          if (e.target === modalRef.current) {
            setShow(false);
            e.preventDefault();
          }
        }}
      >
        <div className="box">
          <form
            method="post"
            className="post"
            action={
              "/logue/api/send/post/" + (currentName ? currentName + "/" : "")
            }
            encType="multipart/form-data"
            ref={formRef}
            onSubmit={handleSubmit(Submit)}
          >
            <input type="hidden" {...register("edit")} />
            <PostTextarea
              registed={SetRegister({
                name: "text",
                ref: textareaRef,
                register,
              })}
              id="post_body_area"
              title="本文"
              placeholder="今何してる？"
              className="body"
            />
            <div className="buttons">
              <button
                type="button"
                className="modifier"
                title="リセット"
                onClick={() => {
                  if (confirm("入力内容をリセットしますか？")) {
                    setEdit();
                    reset(defaultValues);
                    if (show) textareaRef.current?.focus();
                  }
                }}
              >
                <TbEraser />
              </button>
              <PostEditSelectInsert
                textarea={textareaRef.current}
                MenuButtonClassName="modifier"
                MenuButton={<MdOutlinePlaylistAdd />}
              />
              <PostEditSelectDecoration
                textarea={textareaRef.current}
                MenuButtonClassName="modifier"
                MenuButton={<MdOutlinePostAdd />}
              />
              <PostEditSelectMedia
                textarea={textareaRef.current}
                MenuButtonClassName="modifier"
                MenuButton={<MdOutlineAddLink />}
              />
              <button
                type="button"
                className="modifier"
                title={previewMode ? "編集に戻る" : "プレビューを表示する"}
                onClick={() => togglePreviewMode(getValues("text"))}
              >
                {previewMode ? <MdOutlineEditNote /> : <MdOutlineFactCheck />}
              </button>
              <button
                type="submit"
                title="送信"
                disabled={!isDirty || isBusy}
                onClick={() => {
                  Submit();
                }}
              >
                <IoSend />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function OptionButtons() {
  return (
    <div className="buttons">
      <a className="button" title="ホームへ戻る" href="/">
        <FaHome />
      </a>
      <BackUrlButton root={root} />
      <DarkThemeButton />
      <ThreadListArea />
    </div>
  );
}

function LoguePage() {
  const currentName = useParams().name ?? "";
  const current = threadLabeledList.find(({ name }) => name == currentName);
  const postable = useMemo(() => current?.postable ?? true, [current]);
  const refMain = useRef<HTMLElement>(null);
  const [cookies, setCookie] = useCookies();
  const [search, setSearch] = useSearchParams();
  const {
    postsList,
    setPostsList,
    reloadList,
    setReloadList,
    edit,
    setEdit,
    cursor,
    setCursor,
    isSet,
  } = usePostsState();
  const setIsComplete = useAtom(pageIsCompleteAtom)[1];
  const [isFirst] = useAtom(siteIsFirstAtom);
  useEffect(() => {
    if (isFirst) setIsComplete(false);
  }, [isFirst]);
  useEffect(() => {
    if (isFirst && isSet) setIsComplete(true);
  }, [isSet, isFirst]);
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
      typeof postsList[currentName] === "undefined" ||
      reloadList[currentName]
    ) {
      async function Fetch() {
        if (!(cacheSessionName in cookies)) {
          if (typeof caches !== "undefined") await caches.delete(cacheName);
          setCookie(cacheSessionName, Date.now(), {
            path: root,
            maxAge: 60 * 60 * 24 * 30,
          });
        }
        let response: Promise<Response>;
        const url =
          "/logue/api/get/posts/" + (currentName ? currentName + "/" : "");
        if (!postable && typeof caches !== "undefined") {
          if (!(cacheSessionName in cookies)) {
            await caches.delete(cacheName);
            setCookie(cacheSessionName, Date.now(), {
              path: root,
              maxAge: 60 * 60 * 24 * 30,
            });
          }
          const cache = await caches.open(cacheName);
          response = cache.match(url).then(async (cachedData) => {
            if (!cachedData?.status) {
              return cache.add(url).then(async () => (await cache.match(url))!);
            } else return cachedData;
          });
        } else {
          response = fetch(url);
        }
        response
          .then(async (r) => {
            const bodyString = await new Response(r.body).text();
            const rawData: MeeLoguePostRawType[] = JSON.parse(bodyString);
            setPostsList(currentName, ParseThreads(rawData));
          })
          .catch((r: AxiosError) => {
            if (r.response?.status === 401) {
              location.href = getRedirectUrl(location.href);
            } else setPostsList(currentName, null);
          });
      }
      Fetch();
    }
  }, [currentName, reloadList]);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/logue/sw.js").then((reg) => {
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
          "main.list .item[tabindex]"
        ) as HTMLElement | null;
        if (ti) {
          ti.focus();
          ti.blur();
        }
      } else {
        const ti = document.querySelector(
          `main.list .item[data-id="${cursor}"`
        ) as HTMLElement | null;
        ti?.focus();
      }
    }
  }, [id, page]);
  useEffect(() => {
    setKp(page);
  }, [currentName]);
  const posts = postsList[currentName];
  const postsObject = useMemo(() => {
    return findThreads({
      posts: posts ?? [],
      take,
      page,
      q,
      order,
      id,
    });
  }, [posts, search]);
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
        current = document.querySelector(`main.list .item[data-id="${cursor}"`);
      if (!current)
        current = document.querySelector("main.list .item[tabindex]") as any;
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

  const maxPage = useMemo(
    () =>
      postsObject.take ? Math.ceil(postsObject.length / postsObject.take) : 1,
    [postsObject]
  );

  function toggleEdit(id: number, isEdit: boolean) {
    if (isEdit) setEdit();
    else setEdit(id);
  }

  return (
    <>
      <div className="logue">
        <header>
          <div className="list">
            <OptionButtons />
            <SearchArea maxPage={maxPage} />
          </div>
        </header>
        {postable ? <PostForm /> : null}
        {typeof posts === "undefined" ? (
          <Loading />
        ) : (
          <main className="list" ref={refMain}>
            {postsObject.posts.map((v, i) => {
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
                    <span className="num">{v.id}:</span>
                    <Link className="date" to={"?id=" + v.id}>
                      {v.date ? FormatDate(v.date) : null}
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
                              "/logue/api/send/post/" +
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
                    {postable ? (
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
                    ) : null}
                  </div>
                </div>
              );
            })}
          </main>
        )}
        <TopJumpArea />
      </div>
    </>
  );
}
