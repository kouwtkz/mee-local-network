import { Context, Env, Hono } from "hono"
import { BlankSchema } from "hono/types";
import { MeeBindings } from "./MeeBindings";
export type CommonHono = Hono<MeeBindings, BlankSchema, "/">;
export type CommonContext = Context<MeeBindings, string, any>;
