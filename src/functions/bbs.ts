type CompThreadType = ThreadType[] | ThreadsRawType[];

interface FilterThreadsProps {
  threads: CompThreadType;
  id?: number | string;
  q?: string;
}
export function FilterThreads({
  threads,
  id,
  q,
}: FilterThreadsProps) {
  if (typeof id !== "undefined") {
    id = Number(id);
    const thread = threads.find((item) => item.id === id);
    threads = thread ? [thread] : [];
  }
  if (q) {
    threads = threads.filter((item) => item.text?.match(q));
  }
  return threads;
}

interface PagingThreadsProps {
  threads: CompThreadType;
  limit?: number | string;
  p?: number | string;
}
export function PagingThreads({
  threads, limit,
  p = 1,
}: PagingThreadsProps) {
  if (typeof p !== "undefined" && typeof limit !== "undefined") {
    p = Number(p);
    limit = Number(limit);
    threads = threads.slice((p - 1) * limit, p * limit);
  }
  return threads;
}


interface GetThreadsBase extends Omit<FilterThreadsProps, "threads">, Omit<PagingThreadsProps, "threads"> {
  order?: string;
};
interface GetThreadsProps extends GetThreadsBase {
  threads: ThreadType[];
}
export function GetThreads({
  threads,
  id,
  q,
  order = "asc",
  limit,
  p = 1,
}: GetThreadsProps): ThreadsDataType {
  threads = FilterThreads({ threads, id, q });
  if (order === "desc") {
    threads.reverse();
  }
  const length = threads.length;
  threads = PagingThreads({ threads, p, limit });
  return { threads, length, limit: Number(limit) };
}
interface GetRawThreadsProps extends GetThreadsBase {
  threads: ThreadsRawType[];
}
export function GetRawThreads({
  threads,
  id,
  q,
  order = "asc",
  limit,
  p: page = 1,
}: GetRawThreadsProps): ThreadsRawDataType {
  threads = FilterThreads({ threads, id, q });
  if (order === "desc") {
    threads.reverse();
  }
  const length = threads.length;
  threads = PagingThreads({ threads, p: page, limit });
  return { threads, length, limit: Number(limit) };
}

export function ParseThreads(rawThreads: ThreadsRawType[]) {
  return rawThreads.map(args => ({
    date: args.createdAt ? new Date(args.createdAt) : undefined,
    ...args,
  } as ThreadType))
}