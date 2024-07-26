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
import { DarkThemeButton } from "./components/Buttons";
import { FaHome } from "react-icons/fa";
import { findMany, setWhere } from "../functions/findMany";
import { BiSolidLeftArrow } from "react-icons/bi";
import { TopJumpArea } from "./components/TopJump";
import { Loading } from "../layout/Loading";
import { MobileFold } from "./components/MobileFold";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider
    router={createBrowserRouter([
      {
        path: "twitter",
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
  user: KeyValueType<UserType>;
  userFromUserId: KeyValueType<UserType>;
  userLoaded: boolean;
  setUser: (user: KeyValueType<UserType> | null) => void;
  loadedList: string[];
  loaded: boolean;
  setLoaded: (loading: boolean) => void;
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
  setLoaded(loaded) {
    set({ loaded });
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
    async function fetch() {
      if (LoadDMUrls.length === 0) return;
      const cache = await caches.open("twitter-data");
      setLoaded(false);
      const fetchData = LoadDMUrls.map((v) =>
        cache.match(v).then(async (cachedData) => {
          if (!cachedData?.status) {
            return cache.add(v).then(async () => (await cache.match(v))!);
          } else return cachedData;
        })
      );
      Promise.all(fetchData).then(async (responses) => {
        await Promise.all(
          responses.map(async (r) => {
            const contentType = r.headers.get("content-type") || "";
            const bodyString = await new Response(r.body).text();
            if (contentType.includes("javascript")) {
              try {
                addDM(
                  JSON.parse(bodyString.replace(/^[^\[]+|[^\]]+$/g, "")),
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
                  const conversationId =
                    senderId < recipientId
                      ? `${senderId}-${recipientId}`
                      : `${recipientId}-${senderId}`;
                  const text = vars.text ?? vars.message_data?.text;
                  const createdAt = vars.createdAt;
                  const date = new Date(createdAt);
                  dm.set(id, {
                    conversationId,
                    id,
                    senderId,
                    recipientId,
                    text,
                    createdAt,
                    date,
                    mediaUrls: [],
                    urls: [],
                  });
                });
                setDm(dm, { path: r.url });
              }
            }
          })
        );
        setLoaded(true);
      });
    }
    fetch();
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

function OptionButtons() {
  const { pathname, search } = useLocation();
  return (
    <div className="buttons">
      <a className="button" title="ホームへ戻る" href="/">
        <FaHome />
      </a>
      <Link
        className="button"
        title="一つ前へ戻る"
        to={search ? pathname : pathname.replace(/[^\/]*.$/, "")}
      >
        <BiSolidLeftArrow />
      </Link>
      <DarkThemeButton />
      <MobileFold wide={true}>
        <div className="RowList">
          <Link to="?q=mediaUrls%3Atrue">メディアあり</Link>
        </div>
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

function DMMessageItem({ message }: { message: DMMessageType }) {
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
                src={"/twitter/regist/img/" + accountImg}
                title={account.accountDisplayName || account.accountId}
                alt={account.accountDisplayName || account.accountId}
              />
            ) : null}
          </a>
        </div>
        <div>
          <p className="body">
            {message.text.replace(/\shttps:\/\/t.co\/\S+/g, "")}
          </p>
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
                        <img src={url} alt={url} />
                      </a>
                    );
                }
              })}
          </div>
        </div>
      </div>
      <div className="info">
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
  const { dm, userFromUserId, loaded } = useTwitterState();
  const dmArray = useMemo(() => {
    const dmArray = Array.from(dm.values());
    return dmArray;
  }, [dm.size]);

  const nav = useNavigate();
  const { name } = useParams();
  const [search] = useSearchParams();
  const take = 100;
  const q = useMemo(() => search.get("q") || "", [search]);
  useEffect(() => {
    if (q && userFromUserId[q])
      nav("/twitter/dm/" + q + "/", { replace: true });
  }, [q, userFromUserId]);
  function userIdWhere(v: string) {
    return {
      conversationId: { contains: userFromUserId[v]?.accountId ?? v },
    } as findWhereType<DMMessageType>;
  }
  const wheres = useMemo(
    () =>
      setWhere(q, {
        user: userIdWhere,
      }),
    [q, userFromUserId]
  );
  let orderBy: OrderByItem[] = useMemo(() => {
    return wheres.orderBy.concat({ date: "desc" });
  }, [wheres.orderBy]);
  const where = useMemo(() => {
    const where = wheres.where as findWhereType<DMMessageType>[];
    if (name) return where.concat(userIdWhere(name));
    else return where;
  }, [wheres.where, name]);
  const filteredDmArray = findMany({
    list: dmArray,
    where: {
      AND: where,
    },
    orderBy,
  });
  const p = useMemo(() => Number(search.get("p") || 1), [search]);
  const maxPage = useMemo(
    () => Math.ceil(filteredDmArray.length / take),
    [filteredDmArray]
  );
  return (
    <div className="dm">
      <header>
        <OptionButtons />
        <SearchArea maxPage={maxPage} />
      </header>
      {loaded ? (
        <main className="list">
          {filteredDmArray.slice((p - 1) * take, p * take).map((v, i) => (
            <DMMessageItem message={v} key={i} />
          ))}
        </main>
      ) : (
        <Loading />
      )}
      <TopJumpArea />
    </div>
  );
}
