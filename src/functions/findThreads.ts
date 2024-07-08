import { AutoAllotDate } from "./DateFunctions";
import { findMany } from "./findMany";

interface findThreadsProps {
  threads: ThreadType[];
  update?: boolean;
  take?: number;
  page?: number;
  q?: string;
  id?: number;
  common?: boolean;
  pinned?: boolean;
  order?: "asc" | "desc";
}

export default function findThreads(
  { threads, take, page, common, q = "", id, pinned = false, order = "desc" }
    : findThreadsProps): ThreadsDataType {
  if (page) page--;
  const options = {};
  let where: any[] = [];

  if (typeof id !== "number") {
    const wheres = setWhere(q, options);
    id = wheres.id;
    where = wheres.where;
    if (wheres.take) take = wheres.take;
  }
  const skip = (take && page) ? take * page : 0;

  if (common) where.push(
    { draft: false, date: { lte: new Date() } }
  )
  const orderBy: any = []
  if (pinned) orderBy.push({ pin: "desc" })
  orderBy.push({ date: order })
  try {
    let threadsResult: ThreadType[] = threads;
    if (id) {
      const item = threads.find((item) => item.id == id)
      threadsResult = item ? [item] : [];
    } else {
      threadsResult = findMany({
        list: threads,
        where: {
          AND: where,
        },
        orderBy,
      });
    }
    const length = threadsResult.length;
    threadsResult = threadsResult.filter((post, i) => {
      if (take !== undefined && i >= (take + skip)) return false;
      return ++i > skip;
    })
    return { threads: threadsResult, length, take };
  } catch (e) {
    console.log(e);
    return { threads: [], length: 0, take }
  }
}

interface WhereOptionsType {
  hidden?: {
    draft?: boolean
  };
}

function setWhere(q: string, options: WhereOptionsType) {
  const hiddenOption = options.hidden || { draft: false }
  const where: any[] = [];
  let id: number | undefined;
  let take: number | undefined;
  let OR = false, OR_skip = false;
  const searchArray = q.replace(/^\s+|\s+$/, "").split(/\s+/);
  searchArray.forEach((item) => {
    if (item === "OR") {
      OR = true;
      OR_skip = true;
    }
    else if (item.slice(0, 1) === "#") {
      const filterValue = item.slice(1);
      where.push({
        text: {
          contains: new RegExp(`#${filterValue.replace(/(\+)/g, "\\$1")}(\\s|$)`, "i")
        }
      })
    } else {
      const filterKey = item.slice(0, item.indexOf(":"));
      const filterValue = item.slice(filterKey.length + 1);
      switch (filterKey) {
        case "id":
          id = Number(filterValue);
          break;
        case "take":
          take = Number(filterValue);
          break;
        case "title":
        case "body":
          where.push(
            {
              [filterKey]: {
                contains: filterValue
              }
            })
          break;
        case "tag":
        case "hashtag":
          where.push(
            {
              text: {
                contains: `#${filterValue}`
              }
            })
          break;
        case 'user':
          where.push(
            {
              user: {
                name: {
                  contains: filterValue,
                }
              }
            })
          break;
        case 'from':
          where.push(
            {
              name: {
                equals: filterValue
              }
            })
          break;
        case 'since':
          where.push(
            {
              date: { gte: AutoAllotDate({ value: String(filterValue), dayFirst: true }) }
            })
          break;
        case 'until':
          where.push(
            {
              date: { lte: AutoAllotDate({ value: String(filterValue), dayLast: true }) }
            })
          break;
        case 'filter':
        case 'has':
          switch (filterValue.toLowerCase()) {
            case "media":
            case "images":
              where.push(
                {
                  text: {
                    contains: "![%](%)"
                  }
                })
              break;
            case "publish":
              where.push(
                {
                  draft: {
                    equals: false
                  }
                })
              break;
            case "draft":
              where.push(
                {
                  draft: {
                    equals: true
                  }
                })
              break;
            case "pinned":
              where.push(
                {
                  pin: {
                    gt: 0
                  }
                })
              break;
            case "no-pinned":
              where.push(
                {
                  pin: {
                    equals: 0
                  }
                })
              break;
            case "secret-pinned":
              where.push(
                {
                  pin: {
                    lt: 0
                  }
                })
              break;
            case "default":
              hiddenOption.draft = true;
              where.push(
                {
                  AND: [
                    {
                      draft: {
                        equals: false
                      },
                    }
                  ]
                })
              break;
          }
          break;
        default:
          where.push(
            {
              text: {
                contains: item
              }
            })
          break;
      }
    }
    if (OR_skip) {
      OR_skip = false;
    } else if (OR) {
      const current = where.pop();
      const before = where.pop();
      if (before.OR) {
        before.OR.push(current);
        where.push(before);
      } else {
        where.push({
          OR: [
            before,
            current
          ]
        })
      }
      OR = false;
    }
  })
  options.hidden = hiddenOption;
  return { where, id, take };
}