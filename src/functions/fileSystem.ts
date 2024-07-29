import { Dirent, mkdirSync, readdir, readFile } from "fs";

export function mkdirTry(dir: string) {
  try { mkdirSync(dir, { recursive: true }); } catch { }
}

export async function readdirAsync(dir: string, recursive = false) {
  return await new Promise<Dirent[]>((resolve, reject) => {
    readdir(dir, { withFileTypes: true, recursive }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  })
}

export async function readFileAsync(path: string) {
  return new Promise<Buffer>((resolve, reject) => {
    readFile(path, (e, buf) => {
      if (e) reject(e);
      else resolve(buf);
    })
  });
}
