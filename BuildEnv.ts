import { statSync, writeFileSync } from "fs";
import { configDotenv } from 'dotenv'

export function DateUTCString(date: Date = new Date()) {
  return date.toLocaleString("sv-SE", { timeZone: "UTC" }).replace(" ", "T") + "Z";
}
export type EnvType = { [k: string]: string | undefined };
export function readEnv(path: string): EnvType {
  const parsed = configDotenv({ path }).parsed;
  return parsed ? parsed as any : {};
}
export function writeEnv(path: string, env: EnvType) {
  writeFileSync(path, Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));
}
export function SetBuildDate(env: EnvType) {
  env.VITE_BUILD_TIME = DateUTCString();
  const cssFile = "./src/styles.scss";
  try {
    env.VITE_STYLES_TIME = DateUTCString(statSync(cssFile).mtime);
  } catch { }
  return env;
}

export function setBuildEnv(mode: string) {
  const envLocalPath = `.env.${mode}.local`;
  let env: EnvType = {};
  SetBuildDate(env);
  const prodEnv = readEnv('.env.production');
  env = { ...env, ...prodEnv };
  writeEnv(envLocalPath, env);
}
