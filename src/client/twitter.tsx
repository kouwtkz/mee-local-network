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
import { Base } from "./routes/Root";
import ErrorPage from "./routes/ErrorPage";
import { LinksList } from "../layout/default";
import { DarkThemeState } from "./theme";
import { create } from "zustand";
import { FormatDate } from "../functions/DateFunctions";
import { SearchArea } from "./components/Search";
import { BackUrlButton, DarkThemeButton } from "./components/Buttons";
import { FaHome } from "react-icons/fa";
import { findMany, setWhere } from "../functions/findMany";
import { BiConversation, BiUserPin } from "react-icons/bi";
import { TopJumpArea } from "./components/TopJump";
import { Loading } from "../layout/Loading";
import { MobileFold } from "./components/MobileFold";
import { RiDownloadLine } from "react-icons/ri";
import { useCookies } from "react-cookie";
import { ReloadButton } from "./components/Reload";
import { getConversationId } from "#/functions/twitter";
import { getRelativeUrl } from "#/functions/url";

const root = "/twitter/";
const cacheName = "twitter-data";
const cacheSessionName = "twitter-data-session";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider
    router={createBrowserRouter([
      {
        path: root,
        element: (
          <>
            <ScrollRestoration />
            <DarkThemeState />
            <TwitterState />
            <Base>
              <Outlet />
            </Base>
          </>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: <DefaultPage />,
          },
          {
            path: "dm",
            index: true,
            element: <DMPage />,
          },
          {
            path: "dm/:name",
            index: true,
            element: <DMPage />,
          },
        ],
      },
    ])}
  />
);

const defaultEmojiDic: KeyValueType<string> = {
  funny: "😂",
  surprised: "😲",
  sad: "😢",
  like: "❤️",
  excited: "🔥",
  agree: "👍",
  disagree: "👎",
};

type DmMap = Map<string, DMMessageType>;

interface TwitterStateType {
  dm: DmMap;
  setDm: (
    dm: DmMap | null,
    options?: { path?: string; loaded?: boolean }
  ) => void;
  filteredDm: DMMessageType[];
  setFilteredDm: (list: DMMessageType[]) => void;
  user: KeyValueType<UserType>;
  userFromUserId: KeyValueType<UserType>;
  userLoaded: boolean;
  setUser: (user: KeyValueType<UserType> | null) => void;
  loadedList: string[];
  loaded: boolean;
  errored: boolean;
  setLoaded: (loading: boolean, errored?: boolean) => void;
}

export const useTwitterState = create<TwitterStateType>((set) => ({
  dm: new Map(),
  setDm(dm, { path, loaded } = {}) {
    if (dm)
      set((state) => {
        if (path) state.loadedList.push(path);
        return { dm, loaded, path };
      });
  },
  filteredDm: [],
  setFilteredDm(list) {
    set({ filteredDm: list });
  },
  user: {},
  userFromUserId: {},
  userLoaded: false,
  setUser(user) {
    if (user) {
      const userFromUserId = Object.fromEntries(
        Object.values(user)
          .map((u) => [u.username, u])
          .filter(([u]) => u)
      );
      set({ user, userFromUserId, userLoaded: true });
    }
  },
  loadedList: [],
  loaded: false,
  errored: false,
  setLoaded(loaded, errored) {
    set({ loaded, errored });
  },
}));

export function TwitterState() {
  const {
    dm,
    setDm,
    userLoaded,
    setUser,
    userFromUserId,
    setLoaded,
    loadedList,
  } = useTwitterState();
  const [cookies, setCookie] = useCookies();
  const defaultDMPathes = useMemo(
    () => import.meta.env.VITE_DM_PATH?.split(",") ?? [],
    []
  );
  const { name } = useParams();
  const { pathname } = useLocation();
  const currentUser = useMemo(
    () => (name ? userFromUserId[name] : null),
    [userFromUserId, name]
  );
  const notLoadUrls = useMemo(
    () => !userLoaded || !/\/dm(\/|$)/.test(pathname),
    [pathname, userLoaded]
  );
  const LoadDMUrls = useMemo(() => {
    if (notLoadUrls) return [];
    let pathes = currentUser?.dmOnly ? currentUser.dmOnly : defaultDMPathes;
    if (currentUser?.dm) pathes = pathes.concat(currentUser.dm);
    const base = location.href;
    return pathes
      .map((path) => new URL(path, base))
      .filter((Url) => {
        return loadedList.findIndex((url) => url === Url.href) < 0;
      });
  }, [notLoadUrls, currentUser, defaultDMPathes]);
  function addDM(direct_messages?: DMMessagesRawType, path?: string) {
    if (direct_messages) {
      direct_messages.forEach(({ dmConversation }) => {
        dmConversation.messages.forEach(({ messageCreate }) => {
          if (!dm.has(messageCreate.id))
            dm.set(messageCreate.id, {
              date: new Date(messageCreate.createdAt),
              conversationId: dmConversation.conversationId,
              ...messageCreate,
            });
        });
      });
      setDm(dm, { path });
    }
  }
  useEffect(() => {
    async function Fetch() {
      if (LoadDMUrls.length === 0) return;
      setLoaded(false, false);
      let fetchList: Promise<Response>[];
      if (typeof caches !== "undefined") {
        if (!(cacheSessionName in cookies)) {
          await caches.delete(cacheName);
          setCookie(cacheSessionName, Date.now(), {
            path: root,
            maxAge: 60 * 60 * 24 * 30,
          });
        }
        const cache = await caches.open(cacheName);
        fetchList = LoadDMUrls.map((v) =>
          cache.match(v).then(async (cachedData) => {
            if (!cachedData?.status) {
              return cache.add(v).then(async () => (await cache.match(v))!);
            } else return cachedData;
          })
        );
      } else {
        fetchList = LoadDMUrls.map((v) => fetch(v));
      }
      await Promise.all(
        fetchList.map((f) =>
          f.then(async (r) => {
            const contentType = r.headers.get("content-type") || "";
            const bodyString = await new Response(r.body).text();
            if (contentType.includes("javascript")) {
              try {
                addDM(
                  JSON.parse(
                    bodyString.slice(
                      bodyString.indexOf("["),
                      bodyString.lastIndexOf("]") + 1
                    )
                  ),
                  r.url
                );
              } catch {}
            } else {
              const data = JSON.parse(bodyString);
              if (Array.isArray(data)) {
                data.forEach((m, i) => {
                  let { message_create, ...vars } = m;
                  if (message_create) vars = { ...vars, ...message_create };
                  const id = vars.id || `${i}-${r.url}`;
                  const senderId = vars.senderId ?? vars.sender_id;
                  const recipientId =
                    vars.recipientId ?? vars.target?.recipient_id;
                  const conversationId = getConversationId(
                    senderId,
                    recipientId
                  );
                  const text = vars.text ?? vars.message_data?.text;
                  const date = new Date(
                    vars.createdAt ?? Number(vars.created_timestamp)
                  );
                  let urls: DMMessageUrlType[] = [];
                  let mediaUrls: string[] = [];
                  if (vars.message_data) {
                    const md = vars.message_data;
                    ((md.entities?.urls as any[]) ?? []).forEach((e) => {
                      urls.push({
                        url: e.url,
                        display: e.display_url ?? e.display,
                        expanded: e.expanded_url ?? e.expanded,
                      });
                    });
                    if (md.attachment?.media?.media_url) {
                      const mediaUrl = md.attachment.media.media_url;
                      mediaUrls.push(
                        mediaUrl.slice(mediaUrl.lastIndexOf("/") + 1)
                      );
                    }
                  }
                  const createdAt = date.toISOString();
                  dm.set(id, {
                    conversationId,
                    id,
                    senderId,
                    recipientId,
                    text,
                    createdAt,
                    date,
                    mediaUrls,
                    urls,
                  });
                });
                setDm(dm, { path: r.url });
              } else if ("list" in data && Array.isArray(data.list)) {
                (data.list as DMMessageType[]).forEach(
                  ({ date, ...messageCreate }) => {
                    if (!dm.has(messageCreate.id))
                      dm.set(messageCreate.id, {
                        date: new Date(messageCreate.createdAt),
                        ...messageCreate,
                      });
                  }
                );
                setDm(dm, { path: r.url });
              }
            }
          })
        )
      )
        .then(() => {
          setLoaded(true, false);
        })
        .catch((e) => {
          setLoaded(true, true);
        });
    }
    Fetch();
  }, [LoadDMUrls]);
  useEffect(() => {
    if (YTD.user?.regist) {
      const user: KeyValueType<UserType> = YTD.user?.regist;
      Object.values(user).forEach((v) => {
        if (v.createdAt) v.date = new Date(v.createdAt);
      });
      setUser(user);
    }
  }, [YTD.user]);
  return <></>;
}

function DefaultPage() {
  return (
    <div className="simple">
      <LinksList
        root="twitter"
        pathes={["dm"]}
        anchor={({ href, path }) => <Link to={href}>{path}</Link>}
      />
    </div>
  );
}

function DownloadDm() {
  const { filteredDm } = useTwitterState();
  return (
    <button
      className="link"
      type="button"
      title="JSONダウンロード"
      onClick={() => {
        if (confirm("現在の条件のJsonファイルを取得しますか？")) {
          const now = new Date();
          const list = filteredDm.map(
            ({ date, ...args }) => args as DMMessageRawType
          );
          const link = document.createElement("a");
          link.href = URL.createObjectURL(
            new Blob(
              [
                JSON.stringify({
                  createdAt: now.toISOString(),
                  version: 1,
                  list,
                } as ExportDMType),
              ],
              {
                type: "application/octet-stream",
              }
            )
          );
          link.download = "direct-messages.json";
          link.click();
        }
      }}
    >
      <RiDownloadLine />
    </button>
  );
}

function OptionButtons() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const sq = q.split(/\s+/).filter((v) => v);
  function QLink({
    keyword,
    children,
    exist,
  }: {
    keyword: string;
    children: ReactNode;
    exist?: ReactNode;
  }) {
    let _sq = sq.concat();
    const foundIndex = _sq.findIndex((v) => v === keyword);
    if (foundIndex < 0) {
      _sq.push(keyword);
    } else if (exist) {
      _sq.splice(foundIndex, 1);
    }
    const searchLink =
      _sq.length > 0
        ? "?" +
          new URLSearchParams(Object.entries({ q: _sq.join(" ") })).toString()
        : "";
    const Url = new URL(searchLink, location.origin + location.pathname);
    return (
      <Link to={Url.href}>{foundIndex >= 0 && exist ? exist : children}</Link>
    );
  }
  return (
    <div className="buttons">
      <a className="button" title="ホームへ戻る" href="/">
        <FaHome />
      </a>
      <BackUrlButton root={root} />
      <DarkThemeButton />
      <MobileFold wide={true}>
        <ReloadButton
          className="link"
          cacheSession={cacheSessionName}
          cacheOptions={{ path: root }}
        />
        <DownloadDm />
        <QLink keyword="mediaUrls:true">メディア</QLink>
        <QLink keyword="order:asc" exist="新着順にする">
          古い順にする
        </QLink>
        {import.meta.env.VITE_DM_LINKS?.split(",").map((link, i) => {
          const Url = getRelativeUrl("/twitter/dm/" + link, true);
          if (location.href === Url.href) return null;
          else
            return (
              <Link to={Url.href} key={i}>
                {link}
              </Link>
            );
        })}
      </MobileFold>
    </div>
  );
}

function mediaLocalUrl(media: string, id = "") {
  if (import.meta.env.VITE_TWITTER_MEDIA) {
    const twitterMediaPath = import.meta.env.VITE_TWITTER_MEDIA;
    if (media.match(/^http/)) {
      var m_media = media.match(/com\/[^\/]+\/([^\/]*).*\/(.*)$/);
      if (m_media) {
        var video_match = media.match(/\/video\./);
        if (video_match) {
          return (
            twitterMediaPath +
            id +
            "-" +
            (m_media[2].match(/^[^?]+/)?.[0] ?? "")
          );
        } else {
          return twitterMediaPath + m_media[1] + "-" + m_media[2];
        }
      }
    } else {
      return twitterMediaPath + media;
    }
  }
  return "";
}

function DMMessageItem({
  message,
  index = 0,
}: {
  message: DMMessageType;
  index?: number;
}) {
  const { name } = useParams();
  const { user } = useTwitterState();
  const account: UserType = useMemo(() => {
    const accountId = message.senderId;
    return (
      user[accountId] || {
        ...(user["0"] || {}),
        accountDisplayName: "",
        accountId,
        username: "",
      }
    );
  }, [user, message.senderId]);
  const accountImg: string | undefined = useMemo(() => {
    return account.img || user["0"].img;
  }, [user, account]);
  return (
    <div
      className="item"
      data-message-id={message.id}
      data-conversation-id={message.conversationId}
      data-sender-id={message.senderId}
      data-to-id={message.recipientId}
      tabIndex={-1}
    >
      <div className="container">
        <div className="avatar">
          <a
            href={
              account.enableLink ?? true
                ? account.link ??
                  (account.username
                    ? "https://x.com/" + account.username
                    : "https://x.com/intent/user?screen_name=" +
                      account.accountId)
                : undefined
            }
            data-user-id={account.accountId}
            title={account.accountId}
            rel="noopener"
            target="_blank"
          >
            {accountImg ? (
              <img
                className="icon"
                src={"/twitter/data/img/" + accountImg}
                title={account.accountDisplayName || account.accountId}
                alt={account.accountDisplayName || account.accountId}
              />
            ) : null}
          </a>
        </div>
        <div className="body">
          <p className="text">
            {message.text.replace(/(^|\s)https:\/\/t.co\/\S+/g, "")}
          </p>
          {message.urls
            ?.filter((u) => {
              return !/^https:\/\/(twitter|x).com\/messages\/media\//.test(
                u.expanded
              );
            })
            .map(({ expanded }, i) => (
              <p key={i}>
                <a href={expanded} target="_blank">
                  {expanded}
                </a>
              </p>
            ))}
          <div className="media">
            {message.mediaUrls
              .map((url) => mediaLocalUrl(url, message.id))
              .map((url, i) => {
                switch (url.split(".").pop()) {
                  case "":
                    break;
                  case "mp4":
                    return <video controls={true} src={url} key={i} />;
                  default:
                    return (
                      <a href={url} target="_blank" key={i}>
                        <img
                          src={url}
                          alt={url}
                          loading={index < 5 ? "eager" : "lazy"}
                        />
                      </a>
                    );
                }
              })}
          </div>
        </div>
      </div>
      <div className="info">
        {!name ? (
          <>
            <Link
              to={
                getRelativeUrl(
                  account.username
                    ? "/twitter/dm/" + account.username
                    : "?q=user:" + account.accountId,
                  true
                ).href
              }
              title="ユーザーとの会話を開く"
            >
              <BiUserPin />
            </Link>
            <Link
              to={"?q=conversationId:" + message.conversationId}
              title="この会話を開く"
            >
              <BiConversation />
            </Link>
          </>
        ) : null}
        <span className="reactions">
          {message.reactions
            ?.map(({ reactionKey }) => defaultEmojiDic[reactionKey])
            .join()}
        </span>
        <span className="date" data-create-at={message.date}>
          {FormatDate(message.date, "Y/m/d (WW) H:i:s")}
        </span>
      </div>
    </div>
  );
}

function DMPage() {
  const { dm, userFromUserId, loaded, errored, filteredDm, setFilteredDm } =
    useTwitterState();
  const dmArray = useMemo(() => {
    const dmArray = Array.from(dm.values());
    return dmArray;
  }, [dm.size]);

  const nav = useNavigate();
  const { name } = useParams();
  const [search] = useSearchParams();
  const q = useMemo(() => search.get("q") || "", [search]);
  useEffect(() => {
    if (q && userFromUserId[q])
      nav("/twitter/dm/" + q + "/", { replace: true });
  }, [q, userFromUserId]);
  const userIdWhere: findWhereFunction<DMMessageType> = (v: string) => {
    return {
      conversationId: { contains: userFromUserId[v]?.accountId ?? v },
    };
  };
  const wheres = useMemo(
    () =>
      setWhere<DMMessageType>(q, {
        user: userIdWhere,
        mediaUrls: { take: 25 },
      }),
    [q, userFromUserId]
  );
  const take = wheres.take ?? 100;
  let orderBy: OrderByItem<DMMessageType>[] = useMemo(() => {
    return wheres.orderBy.concat({ date: "desc" });
  }, [wheres.orderBy]);
  const where = useMemo(() => {
    const where = [wheres.where] as findWhereType<DMMessageType>[];
    if (name) return where.concat(userIdWhere(name));
    else return where;
  }, [wheres.where, name]);
  useEffect(() => {
    setFilteredDm(
      findMany({
        list: dmArray,
        where: {
          AND: where,
        },
        orderBy,
      })
    );
  }, [dmArray, where, orderBy]);
  const p = useMemo(() => Number(search.get("p") || 1), [search]);
  const maxPage = useMemo(
    () => Math.ceil(filteredDm.length / take),
    [filteredDm]
  );
  return (
    <div className="dm">
      <header>
        <div className="list">
          <OptionButtons />
          <SearchArea maxPage={maxPage} />
        </div>
      </header>
      {loaded ? (
        dm.size === 0 && errored ? (
          <div className="loadingWindow">
            <p>読み込みに失敗しました</p>
            <p>ファイル名が正しいか確認してください</p>
          </div>
        ) : (
          <main className="list">
            {filteredDm.slice((p - 1) * take, p * take).map((v, i) => (
              <DMMessageItem message={v} index={i} key={i} />
            ))}
          </main>
        )
      ) : (
        <Loading />
      )}
      <TopJumpArea />
    </div>
  );
}
