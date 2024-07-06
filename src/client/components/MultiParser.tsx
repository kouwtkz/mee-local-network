import React from "react";
import HTMLReactParser, {
  HTMLReactParserOptions,
  htmlToDOM,
} from "html-react-parser";
import {
  ChildNode,
  Element as NodeElement,
  Text as NodeText,
} from "domhandler";
import { parse } from "marked";
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

type MultiParserOptions = {
  markdown?: boolean;
  toDom?: boolean;
  detailsClosable?: boolean;
  linkPush?: boolean;
  hashtag?: boolean;
};
type MultiParserProps = MultiParserOptions &
  HTMLReactParserOptions & {
    only?: MultiParserOptions;
    className?: string;
    detailsOpen?: boolean;
    tag?: string;
    children?: React.ReactNode;
    parsedClassName?: string;
  };

function MultiParser({
  markdown = true,
  toDom = true,
  linkPush = true,
  hashtag = true,
  detailsOpen = false,
  detailsClosable = true,
  only,
  className,
  tag = "div",
  parsedClassName = "parsed",
  trim = true,
  replace,
  htmlparser2,
  library,
  transform,
  children,
}: MultiParserProps) {
  const nav = useNavigate();
  const [search, setSearch] = useSearchParams();
  if (only) {
    markdown = only.markdown ?? false;
    toDom = only.toDom ?? false;
    linkPush = only.linkPush ?? false;
    hashtag = only.hashtag ?? false;
    detailsClosable = only.detailsClosable ?? false;
  }
  if (typeof children === "string") {
    let childString = children;
    if (markdown) childString = parse(childString, { async: false }) as string;
    if (toDom) {
      let currentTag = "";
      children = HTMLReactParser(childString, {
        trim,
        htmlparser2,
        library,
        transform,
        replace: (v) => {
          switch (v.type) {
            case "tag":
              switch (v.name) {
                case "a":
                  if (linkPush) {
                    currentTag = v.name;
                    const url = v.attribs.href;
                    if (/^\w+:\/\//.test(url)) {
                      v.attribs.target = "_blank";
                      if (v.childNodes.some((node) => node.type === "text"))
                        v.attribs.class =
                          (v.attribs.class ? `${v.attribs.class} ` : "") +
                          "external";
                    } else {
                      v.attribs.onClick = ((e: any) => {
                        const queryFlag = url.startsWith("?");
                        let query = queryFlag
                          ? Object.fromEntries(new URLSearchParams(url))
                          : {};
                        if (queryFlag) {
                          const scroll = query.scroll === "true";
                          if (query.scroll) delete query.scroll;
                          query = {
                            ...Object.fromEntries(
                              new URLSearchParams(location.search)
                            ),
                            ...query,
                          };
                          if (query.p) delete query.p;
                          setSearch(query, { preventScrollReset: !scroll });
                        } else {
                          nav(url);
                        }
                        e.preventDefault();
                      }) as any;
                    }
                  }
                  break;
                case "details":
                  if (detailsOpen && !("manual" in v.attribs))
                    v.attribs.open = "";
                  if (detailsClosable)
                    v.children.push(
                      new NodeElement(
                        "button",
                        {
                          className: "close",
                          onClick: ((e: any) => {
                            e.target.parentElement.removeAttribute("open");
                          }) as any,
                          title: "折りたたむ",
                        },
                        [new NodeText("たたむ")]
                      )
                    );
                  break;
                default:
                  if (typeof location === "undefined" || !(hashtag || linkPush))
                    return;
                  const newChildren = v.children.reduce((a, n) => {
                    if (hashtag && n.type === "text") {
                      if (!/^a$/.test(currentTag) && !/^\s*$/.test(n.data)) {
                        const replaced = n.data.replace(
                          /(^|\s?)(#[^\s#]+)/g,
                          (m, m1, m2) => {
                            const searchParams = createSearchParams({ q: m2 });
                            return `${m1}<a href="?${searchParams.toString()}" class="hashtag">${m2}</a>`;
                          }
                        );
                        if (n.data !== replaced) {
                          htmlToDOM(replaced).forEach((n) => a.push(n));
                          return a;
                        }
                      }
                    }
                    a.push(n);
                    return a;
                  }, [] as ChildNode[]);
                  v.children = newChildren;
                  break;
              }
          }
          if (replace) replace(v, 0);
        },
      });
    } else children = childString;
  }
  className = (className ? `${className} ` : "") + parsedClassName;
  return React.createElement(tag, { className }, children);
}

export default MultiParser;
