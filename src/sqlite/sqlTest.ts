import { using } from "#/functions/using";
import { MeeSqlite } from "./findMeeSqlite";

await using(new MeeSqlite("data/posts.db"), async (db) => {
  console.log(await db.select<MeeLoguePostRawType>(
    {
      params: ["id", "createdAt"],
      table: "posts",
      where: { id: { gt: 10 } },
      take: 3,
      skip: 10
    }
  ).catch((e) => {
    return (e);
  }));
});
