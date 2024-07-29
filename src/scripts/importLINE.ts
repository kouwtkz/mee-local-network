import { FormatDate } from "@/functions/DateFunctions";
import { mkdirTry, readdirAsync, readFileAsync } from "@/functions/fileSystem";
import { getConversationId } from "@/functions/twitter";
import { writeFileSync } from "fs";
import path from "path";

export interface importLINEOptions {
  dir: string;
  idList?: { [k: string]: string | undefined };
  idDefault?: string;
  output?: string;
  outputParent?: string;
}

export async function importLINEfromText({
  dir,
  idList = {},
  idDefault = "line",
  output: _output,
  outputParent = "./import/result/",
}: importLINEOptions) {
  const now = new Date();
  const output = _output ?? idDefault + "_" + FormatDate(now, "Ymd_His") + ".json";
  mkdirTry(outputParent);
  readdirAsync(dir, true).then(dirent => {
    let files = dirent.filter((f) => f.isFile());
    return files.filter(({ name }) => {
      switch (path.extname(name).toLocaleLowerCase()) {
        case ".txt":
          return true;
        default:
          return false;
      }
    }).map((file) =>
      path.resolve(file.parentPath + "/" + file.name)
    );
  }).then((pathes) =>
    pathes.map(
      (path) =>
        readFileAsync(path)
          .then(buf => String(buf))
          .then((str) =>
            (str + "\n")
              .split(/\r?\n/)
              .reduce((a, c) => {
                const m = c.match(/^\s*(\d+\/\d+\/\d+)/);
                function currentCheck() {
                  if (a.current && !a.current.nextDay) {
                    let { date, name, text } = a.current;
                    text = text.replace(/\s+$/, "");
                    if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
                    a.list.push({ date: new Date(date), name, text });
                  }
                }
                if (m) {
                  currentCheck();
                  a.current = { date: new Date(m[1]), name: "", text: "", nextDay: true };
                }
                else if (a.current) {
                  const m = c.match(/^\s*(\d+):(\d+)\t([^\t]+)\t(.*)/);
                  if (m) {
                    currentCheck();
                    const beforeHi = FormatDate(a.current.date, "Hi");
                    a.current.date.setHours(Number(m[1]) % 24)
                    a.current.date.setMinutes(Number(m[2]) % 60)
                    const afterHi = FormatDate(a.current.date, "Hi");
                    a.current.date.setSeconds(beforeHi === afterHi ? (a.current.date.getSeconds() + 1) : 0)
                    a.current.name = m[3];
                    a.current.text = m[4];
                    a.current.nextDay = false;
                  } else {
                    a.current.text = a.current.text + "\n" + c;
                  }
                }
                return a;
              }, { list: [] } as {
                current?: talkMessageTypeCurrent;
                list: talkMessageType[]
              }).list
          )
    )
  ).then(list =>
    Promise.all(list)
      .then(v =>
        v.reduce((a, c) => {
          c.forEach(item => {
            const key = item.date.getTime();
            if (!a.has(key)) a.set(key, item);
          })
          return a;
        }, new Map<number, talkMessageType>())
      ).then(map => Array.from(map.values()))
  ).then(list => {
    const containIdList = list
      .reduce((a, { name }) => {
        const id = idList[name] ?? name;
        if (!a.some((v) => v === id)) a.push(id);
        return a;
      }, [] as string[]);
    return list.map(item => {
      const date = item.date;
      const id = idDefault + "_" + FormatDate(date, "Ymd_His");
      let mediaUrls: string[] = [];
      const senderId = idList[item.name] ?? item.name;
      const recipientId = containIdList.find(id => id !== senderId) ?? "";
      const conversationId = getConversationId(senderId, recipientId);
      return {
        id,
        date,
        conversationId,
        createdAt: date.toISOString(),
        mediaUrls,
        senderId,
        recipientId,
        text: item.text,
      } as DMMessageType;
    })
  }).then(messages => {
    messages.sort((a, b) => a.date.getTime() - b.date.getTime());
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

interface talkMessageType {
  date: Date;
  name: string;
  text: string;
};

interface talkMessageTypeCurrent extends talkMessageType {
  nextDay: boolean;
}
