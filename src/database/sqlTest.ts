import { using } from "#/functions/using";
import { MeeSqlite } from "./MeeSqlite";

await using(new MeeSqlite("data/posts.db"), async (db) => {
  await db.select<MeeLoguePostRawType>(
    {
      params: ["id", "createdAt"],
      table: "posts",
      where: { id: { gt: 10 } },
      take: 3,
      skip: 10
    }
  ).then((result) => {
    console.log(result);
    return result;
  }).catch((e) => {
    console.error(e);
  });
});
