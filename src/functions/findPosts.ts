import { findMee, setWhere } from "#/functions/find/findMee";

interface findPostsProps {
  posts: MeeLoguePostType[];
  update?: boolean;
  take?: number;
  page?: number;
  q?: string;
  id?: number;
  common?: boolean;
  pinned?: boolean;
  order?: OrderByType;
}

export default function findPosts(
  { posts, take, page, common, q = "", id, pinned = false, order = "desc" }
    : findPostsProps): MeeLogueDataType {
  if (page) page--;
  const options: WhereOptionsKvType<MeeLoguePostType> = { hashtag: { textKey: "text" }, time: { key: "date" } };
  let where: any[] = [];
  let orderBy: OrderByItem<MeeLoguePostType>[] = []

  if (typeof id !== "number") {
    const wheres = setWhere(q, options);
    id = wheres.id;
    where = [wheres.where];
    if (wheres.take) take = wheres.take;
    if (wheres.orderBy.length > 0) orderBy = orderBy.concat(wheres.orderBy);
  }
  const skip = (take && page) ? take * page : 0;

  orderBy.push({ date: order });

  if (common) where.push(
    { draft: false, date: { lte: new Date() } }
  )
  try {
    let PostsResult: MeeLoguePostType[] = posts.concat();
    if (id) {
      const item = posts.find((item) => item.id == id)
      PostsResult = item ? [item] : [];
    } else {
      PostsResult = findMee({
        list: posts,
        where: {
          AND: where,
        },
        orderBy,
      });
    }
    const length = PostsResult.length;
    PostsResult = PostsResult.filter((post, i) => {
      if (take !== undefined && i >= (take + skip)) return false;
      return ++i > skip;
    })
    return { posts: PostsResult, length, take };
  } catch (e) {
    console.log(e);
    return { posts: [], length: 0, take }
  }
}
