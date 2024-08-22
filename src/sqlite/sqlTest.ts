import { MeeSqlite } from "./findMeeSqlite";

const db = new MeeSqlite("data/local.db");
console.log(
  await db.select<MeeLoguePostRawType>(
    {
      params: ["id", "createdAt"],
      table: "threads",
      where: { id: { gt: 10 } },
      take: 3,
      skip: 10
    }
  )
)
// console.log(
//   await db.select<MeeLoguePostRawType>(
//     {
//       table: "threads",
//       where: { id: { lt: 5 } },
//       orderBy: { id: "desc" }
//     }
//   )
// )

// db.begin();
// await db.delete<MeeLoguePostRawType>({ table: "threads", where: { id: { equals: 10000 } } });
// await db.insert<MeeLoguePostRawType>({ table: "threads", entry: { id: 10000, text: "めぇ", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } })
// db.commit();

// db.begin();
// await db.dropTable("test4");
// await db.createTable({ table: "test4", entry: { id: { primary: true, type: "INT" }, a: { default: "mee2" } } }).catch((e) => {})
// db.commit()