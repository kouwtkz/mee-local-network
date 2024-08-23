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

interface PagingPostsProps {
  posts: CompThreadType;
  limit?: number | string;
  p?: number | string;
}
export function PagingPosts({
  posts, limit,
  p = 1,
}: PagingPostsProps) {
  if (typeof p !== "undefined" && typeof limit !== "undefined") {
    p = Number(p);
    limit = Number(limit);
    posts = posts.slice((p - 1) * limit, p * limit);
  }
  return posts;
}


interface GetPostsBase extends Omit<FilterPostsProps, "posts">, Omit<PagingPostsProps, "posts"> {
  order?: string;
};
interface GetPostsProps extends GetPostsBase {
  posts: MeeLoguePostType[];
}
export function GetPosts({
  posts,
  id,
  q,
  order = "asc",
  limit,
  p = 1,
}: GetPostsProps): MeeLogueDataType {
  posts = FilterPosts({ posts, id, q });
  if (order === "desc") {
    posts.reverse();
  }
  const length = posts.length;
  posts = PagingPosts({ posts, p, limit });
  return { posts, length, take: Number(limit) };
}
interface GetRawPostsProps extends GetPostsBase {
  posts: MeeLoguePostRawType[];
}
export function GetRawPosts({
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
  posts = PagingPosts({ posts, p: page, limit });
  return { posts, length, take: Number(limit) };
}

export function ParsePosts(rawPosts: MeeLoguePostRawType[]) {
  return rawPosts.map(args => ({
    date: args.createdAt ? new Date(args.createdAt) : undefined,
    update: args.updatedAt ? new Date(args.updatedAt) : undefined,
    ...args,
  } as MeeLoguePostType))
}

export function GetPostsTable(name?: string) {
  return (name ? name + "_" : "") + "posts";
}

export function MeeLoguePostToRaw(post: MeeLoguePostType): MeeLoguePostRawType {
  let { createdAt, id, name, text, updatedAt } = post;
  return {
    id,
    createdAt,
    name,
    text,
    updatedAt,
  };
}
export function MeeLoguePostsToRaw(posts: MeeLoguePostType[]) {
  return posts.map(post => MeeLoguePostToRaw(post));
}