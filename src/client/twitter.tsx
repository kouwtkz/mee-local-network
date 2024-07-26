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
import axios from "axios";
import { TopJumpArea } from "./components/TopJump";

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

interface DMMessageRawType {
  id: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  text: string;
  urls: string[];
  mediaUrls: string[];
  reactions?: [
    {
      senderId: string;
      reactionKey: string;
      eventId: string;
      createdAt: string;
    }
  ];
}

interface DMMessageType extends DMMessageRawType {
  date: Date;
  conversationId: string;
}

interface UserRawType {
  username: string;
  accountId: string;
  createdAt?: string;
  accountDisplayName: string;
  img?: string;
  re?: string | RegExp;
  listIn?: true;
  link?: string;
  enableLink?: true;
  index?: number;
}

interface UserType extends UserRawType {
  date?: Date;
}

type DMMessagesRawType = KeyValueType<
  {
    dmConversation: {
      conversationId: string;
      messages: [
        {
          messageCreate: DMMessageRawType;
        }
      ];
    };
  }[]
>;

declare const YTD: {
  direct_messages?: DMMessagesRawType;
  direct_message?: DMMessagesRawType;
  user?: {
    regist?: KeyValueType<UserRawType>;
  };
};

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
  setDm: (dm: DmMap | null) => void;
  user: KeyValueType<UserType>;
  userFromUserId: KeyValueType<UserType>;
  setUser: (user: KeyValueType<UserType> | null) => void;
}

export const useTwitterState = create<TwitterStateType>((set) => ({
  dm: new Map(),
  setDm(dm) {
    if (dm) set({ dm });
  },
  user: {},
  userFromUserId: {},
  setUser(user) {
    if (user) {
      const userFromUserId = Object.fromEntries(
        Object.values(user)
          .map((u) => [u.username, u])
          .filter(([u]) => u)
      );
      set({ user, userFromUserId });
    }
  },
}));
export function TwitterState() {
  const { dm, setDm, setUser } = useTwitterState();
  function addDM(direct_messages?: DMMessagesRawType) {
    if (direct_messages) {
      Object.entries(direct_messages).forEach(([k, v]) => {
        v?.forEach(({ dmConversation }) => {
          dmConversation.messages.forEach(({ messageCreate }) => {
            if (!dm.has(messageCreate.id))
              dm.set(messageCreate.id, {
                date: new Date(messageCreate.createdAt),
                conversationId: dmConversation.conversationId,
                ...messageCreate,
              });
          });
        });
      });
      setDm(dm);
    }
  }
  useEffect(() => {
    addDM(YTD.direct_messages);
  }, [YTD.direct_messages]);
  useEffect(() => {
    addDM(YTD.direct_message);
  }, [YTD.direct_message]);
  useEffect(() => {
    import.meta.env.VITE_ADD_DM?.split(",").forEach((v) => {
      axios.get(v).then((r) => {
        if (Array.isArray(r.data)) {
          r.data.forEach((m, i) => {
            let { message_create, ...vars } = m;
            if (message_create) vars = { ...vars, ...message_create };
            const id = vars.id || `${i}-${v}`;
            const senderId = vars.senderId ?? vars.sender_id;
            const recipientId = vars.recipientId ?? vars.target?.recipient_id;
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
          setDm(dm);
        }
      });
    });
  }, []);
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
  const { pathname } = useLocation();
  return (
    <div className="buttons">
      <a className="button" title="ホームへ戻る" href="/">
        <FaHome />
      </a>
      <Link
        className="button"
        title="一つ前へ戻る"
        to={pathname.replace(/[^\/]*.$/, "")}
      >
        <BiSolidLeftArrow />
      </Link>
      <DarkThemeButton />
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
                src={"/assets/user/img/" + accountImg}
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
  const { dm, userFromUserId } = useTwitterState();
  const dmArray = useMemo(() => {
    const dmArray = Array.from(dm.values());
    return dmArray;
  }, [dm.size]);

  const nav = useNavigate();
  const params = useParams();
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
    if (params.name) return where.concat(userIdWhere(params.name));
    else return where;
  }, [wheres.where, params.name]);
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
      <main className="list">
        {filteredDmArray.slice((p - 1) * take, p * take).map((v, i) => (
          <DMMessageItem message={v} key={i} />
        ))}
      </main>
      <TopJumpArea />
    </div>
  );
}
