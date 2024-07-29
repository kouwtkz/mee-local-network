import { FormatDate } from "@/functions/DateFunctions";
import { getConversationId } from "@/functions/twitter";
import { Dirent, mkdirSync, readdir, readFile, writeFileSync } from "fs";
import { ParsedMail, simpleParser } from "mailparser";
import path from "path";

export interface importMailOptions {
  dir: string;
  take?: number;
  page?: number;
  idList?: { [k: string]: string | undefined };
  output?: string;
  outputParent?: string;
  mediaParent?: string;
}

export async function importMail({
  dir,
  take,
  page = 0,
  idList = {},
  output: _output,
  outputParent = "./import/result/",
  mediaParent = "./import/media/",
}: importMailOptions) {
  const now = new Date();
  const output = _output ?? "mail_" + FormatDate(now, "Ymd_His") + ".json";
  try {
    mkdirSync(outputParent, { recursive: true });
  } catch { }
  try {
    mkdirSync(mediaParent, { recursive: true });
  } catch { }
  return await new Promise<Dirent[]>((resolve, reject) => {
    readdir(dir, { recursive: true, withFileTypes: true }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  })
    .then((dirent) => {
      let files = dirent.filter((f) => f.isFile());
      if (take !== undefined)
        files = files.slice(page * take, (page + 1) * take);
      return files.map((file) =>
        path.resolve(file.parentPath + "/" + file.name)
      );
    })
    .then((pathes) =>
      pathes.map(
        (path) =>
          new Promise<ParsedMail>((resolve, reject) => {
            readFile(path, (e, brob) => {
              if (e) reject(e);
              simpleParser(brob)
                .then((mail) => {
                  resolve(mail);
                })
                .catch((e) => {
                  reject(e);
                });
            });
          })
      )
    )
    .then((mails) =>
      mails.map((pm, i) =>
        pm.then((mail) => {
          const date = mail.date ?? new Date(0);
          const id = mail.messageId
            ? mail.messageId.slice(1, -1).replace(/[@.]/g, "_")
            : "mail_" + FormatDate(date, "Ymd_His");
          let mediaUrls: string[] = [];
          mail.attachments.forEach((v) => {
            const filename = (id ? id + "-" : "") + v.filename;
            const fullpath = path.resolve(mediaParent, filename);
            writeFileSync(fullpath, v.content);
            mediaUrls.push(filename);
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
