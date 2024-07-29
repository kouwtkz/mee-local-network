import { FormatDate } from "@/functions/DateFunctions";
import { mkdirTry, readdirAsync, readFileAsync } from "@/functions/fileSystem";
import { getConversationId } from "@/functions/twitter";
import { existsSync, writeFileSync } from "fs";
import { simpleParser } from "mailparser";
import path from "path";

export interface importMailOptions {
  dir: string;
  idList?: { [k: string]: string | undefined };
  idDefault?: string;
  output?: string;
  outputParent?: string;
  mediaParent?: string;
  mediaDir?: string;
}

export async function importMail({
  dir,
  idList = {},
  idDefault = "mail",
  output: _output,
  outputParent = "./import/result/",
  mediaParent = "./import/media/",
  mediaDir = "",
}: importMailOptions) {
  const now = new Date();
  const output = _output ?? idDefault + "_" + FormatDate(now, "Ymd_His") + ".json";
  mkdirTry(outputParent);
  mkdirTry(path.resolve(mediaParent, mediaDir));
  return readdirAsync(dir, true)
    .then((dirent) => {
      let files = dirent.filter((f) => f.isFile());
      return files.map((file) =>
        path.resolve(file.parentPath + "/" + file.name)
      );
    })
    .then((pathes) =>
      pathes.map(
        (path) =>
          readFileAsync(path).then(buf => simpleParser(buf))
      )
    )
    .then((mails) =>
      mails.map((pm) =>
        pm.then((mail) => {
          const date = mail.date ?? new Date(0);
          const id = mail.messageId
            ? mail.messageId.slice(1, -1).replace(/[@.]/g, "_")
            : idDefault + "_" + FormatDate(date, "Ymd_His");
          let mediaUrls: string[] = [];
          mail.attachments.forEach((v) => {
            const filename = (id ? id + "-" : "") + v.filename;
            const fullpath = path.resolve(mediaParent, mediaDir, filename);
            if (!existsSync(fullpath)) writeFileSync(fullpath, v.content);
            mediaUrls.push((mediaDir ? mediaDir + "/" : "") + filename);
          });
          const from = mail.from?.text ?? "";
          const senderId = idList[from] ?? from;
          const to =
            (Array.isArray(mail.to) ? mail.to[0] : mail.to)?.text ?? "";
          const recipientId = idList[to] ?? to;
          const conversationId = getConversationId(senderId, recipientId);
          return {
            id,
            date,
            conversationId,
            createdAt: date.toISOString(),
            mediaUrls,
            senderId,
            recipientId,
            text: mail.text ?? "",
          } as DMMessageType;
        })
      )
    )
    .then(async (r) => {
      const messages = await Promise.all(r).then((list) => {
        list.sort((a, b) => a.date.getTime() - b.date.getTime());
        return list.map(({ date, ...dm }) => dm as DMMessageRawType);
      });
      writeFileSync(
        path.resolve(outputParent, output),
        JSON.stringify({
          createdAt: now.toISOString(),
          version: 1,
          list: messages,
        } as ExportDMType)
      );
    });
}
