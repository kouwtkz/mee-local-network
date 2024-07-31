type CompThreadType = MeeLoguePostType[] | MeeLoguePostRawType[];

interface FilterPostsProps {
  posts: CompThreadType;
  id?: number | string;
  q?: string;
}
export function FilterPosts({
  posts,
  id,
  q,
}: FilterPostsProps) {
  if (typeof id !== "undefined") {
    id = Number(id);
    const post = posts.find((item) => item.id === id);
    posts = post ? [post] : [];
  }
  if (q) {
    posts = posts.filter((item) => item.text?.match(q));
  }
  return posts;
}

interface PagingThreadsProps {
  posts: CompThreadType;
  limit?: number | string;
  p?: number | string;
}
export function PagingThreads({
  posts, limit,
  p = 1,
}: PagingThreadsProps) {
  if (typeof p !== "undefined" && typeof limit !== "undefined") {
    p = Number(p);
    limit = Number(limit);
    posts = posts.slice((p - 1) * limit, p * limit);
  }
  return posts;
}


interface GetPostsBase extends Omit<FilterPostsProps, "posts">, Omit<PagingThreadsProps, "posts"> {
  order?: string;
};
interface GetThreadsProps extends GetPostsBase {
  posts: MeeLoguePostType[];
}
export function GetThreads({
  posts,
  id,
  q,
  order = "asc",
  limit,
  p = 1,
}: GetThreadsProps): MeeLogueDataType {
  posts = FilterPosts({ posts, id, q });
  if (order === "desc") {
    posts.reverse();
  }
  const length = posts.length;
  posts = PagingThreads({ posts, p, limit });
  return { posts, length, take: Number(limit) };
}
interface GetRawPostsProps extends GetPostsBase {
  posts: MeeLoguePostRawType[];
}
export function GetRawThreads({
  posts,
  id,
  q,
  order = "asc",
  limit,
  p: page = 1,
}: GetRawPostsProps): MeeLogueRawDataType {
  posts = FilterPosts({ posts, id, q });
  if (order === "desc") {
    posts.reverse();
  }
  const length = posts.length;
  posts = PagingThreads({ posts, p: page, limit });
  return { posts, length, take: Number(limit) };
}

export function ParseThreads(rawThreads: MeeLoguePostRawType[]) {
  return rawThreads.map(args => ({
    date: args.createdAt ? new Date(args.createdAt) : undefined,
    update: args.updatedAt ? new Date(args.updatedAt) : undefined,
    ...args,
  } as MeeLoguePostType))
}