import { AutoAllotDate } from "./DateFunctions";
import { findMany, setWhere } from "./findMany";

interface findThreadsProps {
  threads: ThreadType[];
  update?: boolean;
  take?: number;
  page?: number;
  q?: string;
  id?: number;
  common?: boolean;
  pinned?: boolean;
  order?: OrderByType;
}

export default function findThreads(
  { threads, take, page, common, q = "", id, pinned = false, order = "desc" }
    : findThreadsProps): ThreadsDataType {
  if (page) page--;
  const options = {};
  let where: any[] = [];
  let orderBy: OrderByItem[] = []

  if (typeof id !== "number") {
    const wheres = setWhere(q, options);
    id = wheres.id;
    where = wheres.where;
    if (wheres.take) take = wheres.take;
    if (wheres.orderBy.length > 0) orderBy = orderBy.concat(wheres.orderBy);
  }
  const skip = (take && page) ? take * page : 0;

  orderBy.push({ date: order });
  if (pinned) orderBy.unshift({ pin: "desc" });

  if (common) where.push(
    { draft: false, date: { lte: new Date() } }
  )
  try {
    let threadsResult: ThreadType[] = threads.concat();
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
