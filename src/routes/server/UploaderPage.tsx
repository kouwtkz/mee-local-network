/// <reference types="vite/client" />

import React from "react";
import { existsSync, readdirSync, Stats, statSync } from "fs";
import { CommonContext } from "../../types/HonoCustomType";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";

export const uploaderOptions = {
  title: "簡易あぷろだ",
  upload_dir: import.meta.env.PROD
    ? "../static/images/uploads/"
    : "./static/images/uploads/",
  upload_dir_url: "/images/uploads/",
};

interface FileType extends Omit<Stats, "isFile" | "isDirectory"> {
  filename: string;
  path: string;
  dir: string;
  isFile: boolean;
  isDirectory: boolean;
}
function get_filelist(dir: string) {
  const args: { list?: FileType[]; error?: string } = {};
  if (existsSync(dir)) {
    const list = readdirSync(dir)
      .map((filename, i) => {
        const path = dir + filename;
        const stat = statSync(path);
        return {
          ...stat,
          ...({
            filename: filename,
            path: path,
            dir: dir,
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
          } as FileType),
        };
      })
      .filter((item) => item.isFile);
    list.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    Object.assign(args, { list: list });
  } else {
    args.error = "※アップロードパスが存在してません！";
  }
  return args;
}

export interface UploaderPageProps {
  c: CommonContext;
  max?: number;
  paging?: boolean;
}

export interface PagingAreaProps extends UploaderPageProps {
  page: number;
  length: number;
}

function PagingArea({ c, max, paging = true, page, length }: PagingAreaProps) {
  if (!paging) return <></>;
  let pageMax = 1;
  if (max) pageMax = Math.ceil(length / max);
  return (
    <div className="paging">
      <a
        title="前のページへ戻る"
        {...(page > 1
          ? { href: page === 2 ? "./" : "?p=" + (page - 1) }
          : { tabIndex: -1 })}
      >
        <MdArrowBackIosNew />
      </a>
      <div className="status">
        <span>{page}</span>
        <span>/</span>
        <span>{pageMax}</span>
      </div>
      <a
        title="次のページに進む"
        {...(page < pageMax ? { href: "?p=" + (page + 1) } : { tabIndex: -1 })}
      >
        <MdArrowForwardIos />
      </a>
    </div>
  );
}

function UploaderViewer({ c, max, ...props }: UploaderPageProps) {
  const Url = new URL(c.req.url);
  const page = Number(Url.searchParams.get("p") ?? 1);
  let filelist = get_filelist(uploaderOptions.upload_dir).list;
  let fileLength = filelist?.length ?? 0;
  if (filelist && max) filelist = filelist.slice((page - 1) * max, page * max);
  return (
    <div className="viewer preview">
      {filelist ? (
        <>
          <ul>
            {filelist.map((file, i) => (
              <li key={i}>
                <a href={uploaderOptions.upload_dir_url + file.filename}>
                  <img
                    src={uploaderOptions.upload_dir_url + file.filename}
                    alt={file.filename}
                  />
                </a>
                <button
                  type="button"
                  className="delete"
                  data-delete-button={file.filename}
                >
                  削除する
                </button>
              </li>
            ))}
          </ul>
          <PagingArea
            c={c}
            max={max}
            length={fileLength}
            page={page}
            {...props}
          />
        </>
      ) : null}
    </div>
  );
}

export function UploaderPage({ max = 3, ...props }: UploaderPageProps) {
  return (
    <>
      <h1>{uploaderOptions.title}</h1>
      <form className="uploader" method="post" encType="multipart/form-data">
        <input
          type="file"
          name="uploadedfile"
          title="アップロードするファイル"
        />
        <button type="submit">送信する</button>
      </form>
      <UploaderViewer max={max} paging={false} {...props} />
      <ul>
        <li>
          <a href="/uploader/viewer/">ビューア</a>
        </li>
        <li>
          <a href="/">トップへ戻る</a>
        </li>
      </ul>
    </>
  );
}

export function UploaderViewerPage({ max = 10, ...props }: UploaderPageProps) {
  return (
    <>
      <h1>{uploaderOptions.title}</h1>
      <UploaderViewer max={max} paging={true} {...props} />
      <ul>
        <li>
          <a href="/uploader/">アップロードページに戻る</a>
        </li>
        <li>
          <a href="/">トップへ戻る</a>
        </li>
      </ul>
    </>
  );
}
