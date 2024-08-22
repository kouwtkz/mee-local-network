import { MeeSqlite } from "./findMeeSqlite";

const db = new MeeSqlite("data/local.db");
// console.log(
//   db.select<MeeLoguePostRawType>(
//     {
//       params: ["id", "createdAt"],
//       table: "threads",
//       where: { id: { gt: 10 } },
//       take: 3,
//       skip: 10
//     }
//   )
// )
console.log(
  db.select<MeeLoguePostRawType>(
    {
      table: "threads",
      where: { id: { lt: 5 } },
      orderBy: { id: "desc" }
    }
  )
)

// db.insert<MeeLoguePostRawType>({ table: "threads", entry: { id: 10000, text: "めぇ", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } })
// db.delete<MeeLoguePostRawType>({ table: "threads", where: { id: { equals: 10000 } } })

// db.update<MeeLoguePostRawType>({ table: "threads", entry: { text: "めぇ！！！" } as any, where: { id: { equals: 1 } } })
