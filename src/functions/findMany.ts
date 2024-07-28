import { AutoAllotDate } from "./DateFunctions";

export function findMany<T>({
  list,
  where,
  take,
  orderBy,
  skip = 0,
}: findManyProps<T>): T[] {
  if (!list) return [];
  orderBy
    ?.reduce((a, c) => {
      Object.entries(c).forEach(([k, v]) => {
        if (a.findIndex((f) => k in f) < 0) {
          if (c) a.push({ [k]: v as OrderByType });
        }
      });
      return a;
    }, [] as { [k: string]: OrderByType }[])
    .reverse()
    .forEach((args) => {
      Object.entries(args).forEach(([k, v]) => {
        switch (v) {
          case "asc":
            list.sort((a: any, b: any) =>
              a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0
            );
            break;
          case "desc":
            list.sort((a: any, b: any) =>
              a[k] < b[k] ? 1 : a[k] > b[k] ? -1 : 0
            );
            break;
        }
      });
    });
  let i = 0;
  return list.filter((value) => {
    if (take !== undefined && i >= take + skip) return false;
    const result = whereLoop(value, where);
    if (result) i++;
    return result && i > skip;
  });
}

function whereLoop<T>(value: T, where: findWhereType<T> | undefined): boolean {
  function recursion(__where: findWhereType<T>): boolean {
    return Object.entries(__where).every(([fkey, fval]) => {
      const fvalWheres: findWhereType<T>[] = fval;
      switch (fkey) {
        case "AND":
          return fvalWheres.every((_val) => recursion(_val));
        case "OR":
          return fvalWheres.some((_val) => recursion(_val));
        case "NOT":
          return !fvalWheres.some((_val) => recursion(_val));
        default:
          const _value: any = value;
          const cval = _value[fkey];
          if (typeof fval === "object") {
            const _conditions: [any, any][] = Object.entries(fval);
            const conditions: [filterConditionsAllType, any][] = _conditions;
            return conditions.every(([k, v]) => {
              switch (k) {
                case "equals":
                  return cval == v;
                case "not":
                  return cval != v;
                case "contains":
                  if (Array.isArray(cval)) return cval.some((x) => x === v);
                  else if (typeof v === "object" && "test" in v)
                    return v.test(cval);
                  else return String(cval).match(v);
                case "startsWith":
                  return String(cval).startsWith(v);
                case "endsWith":
                  return String(cval).endsWith(v);
                case "gt":
                  return cval > v;
                case "gte":
                  return cval >= v;
                case "lt":
                  return cval < v;
                case "lte":
                  return cval <= v;
                case "bool":
                  let boolVal: boolean;
                  if (Array.isArray(cval)) boolVal = cval.length > 0;
                  else boolVal = Boolean(cval);
                  return v ? boolVal : !boolVal;
                default:
                  return false;
              }
            });
          } else {
            return cval == fval;
          }
      }
    });
  }
  return where ? recursion(where) : true;
}

function createFilterEntry(
  filterValue: string
): filterConditionsAllKeyValue<any> {
  if (filterValue.startsWith('"') && filterValue.endsWith('"')) {
    return {
      equals: filterValue.slice(1, -1),
    };
  } else {
    return {
      contains: filterValue,
    };
  }
}

function getKeyFromOptions<T>(key: string, options: WhereOptionsKvType<T>) {
  return typeof options[key] === "object" && options[key].key
    ? options[key].key
    : key;
}

export function setWhere<T>(q: string, options: WhereOptionsKvType<T> = {}) {
  const textKey = getKeyFromOptions("text", options);
  const fromKey = getKeyFromOptions("from", options);
  const dateKey = getKeyFromOptions("date", options);
  const where: findWhereType<any>[] = [];
  let id: number | undefined;
  let take: number | undefined;
  const orderBy: OrderByItem[] = [];
  let OR = false,
    OR_skip = false;
  const searchArray = q.replace(/^\s+|\s+$/, "").split(/\s+/);
  searchArray.forEach((item) => {
    if (item === "OR") {
      OR = true;
      OR_skip = true;
    } else {
      let whereItem: findWhereType<any> | undefined;
      let NOT = item.startsWith("-");
      if (NOT) item = item.slice(1);
      if (item.startsWith("#")) {
        const filterValue = item.slice(1);
        whereItem = {
          [textKey]: {
            contains: new RegExp(
              `#${filterValue.replace(/(\+)/g, "\\$1")}(\\s|$)`,
              "i"
            ),
          },
        };
      } else {
        const colonIndex = /^\w+:\/\//.test(item) ? -1 : item.indexOf(":");
        const filterKey = colonIndex >= 0 ? item.slice(0, colonIndex) : "";
        const filterValue = item.slice(filterKey.length + 1);
        let filterOptions: WhereOptionsType<T>;
        switch (typeof options[filterKey]) {
          case "object":
            filterOptions = options[filterKey];
            break;
          case "function":
            filterOptions = { where: options[filterKey] };
            break;
          case "undefined":
            filterOptions = {};
            break;
          default:
            filterOptions = { key: options[filterKey] };
            break;
        }
        let filterTake = filterOptions.take;
        switch (filterKey.toLocaleLowerCase()) {
          case "":
            if (item) {
              whereItem = {
                [textKey]: createFilterEntry(item),
              };
            }
            break;
          case "id":
            id = Number(filterValue);
            break;
          case "take":
            take = Number(filterValue);
            break;
          case "order":
            const orderValue = filterValue.toLocaleLowerCase();
            switch (orderValue) {
              case "asc":
              case "desc":
                orderBy.push({ [dateKey]: orderValue });
                break;
            }
            break;
          case "sort":
            const sortOrder = filterValue.includes("!");
            const sortKey = sortOrder
              ? filterValue.replace("!", "")
              : filterValue;
            switch (sortKey) {
              case "date":
              case "update":
                orderBy.push({ [sortKey]: sortOrder ? "asc" : "desc" });
                break;
              default:
                orderBy.push({ [sortKey]: sortOrder ? "desc" : "asc" });
                break;
            }
            break;
          case "tag":
          case "hashtag":
            whereItem = {
              [textKey]: {
                contains: `#${filterValue}`,
              },
            };
            break;
          case "from":
            whereItem = {
              [fromKey]: {
                equals: filterValue,
              },
            };
            break;
          case "since":
            whereItem = {
              [dateKey]: {
                gte: AutoAllotDate({
                  value: String(filterValue),
                  dayFirst: true,
                }),
              },
            };
            break;
          case "until":
            whereItem = {
              [dateKey]: {
                lte: AutoAllotDate({
                  value: String(filterValue),
                  dayLast: true,
                }),
              },
            };
            break;
          case "filter":
          case "has":
            switch (filterValue.toLowerCase()) {
              case "media":
              case "images":
                whereItem = {
                  [textKey]: {
                    contains: "![%](%)",
                  },
                };
                break;
              case "publish":
                whereItem = {
                  draft: {
                    equals: false,
                  },
                };
                break;
              case "draft":
                whereItem = {
                  draft: {
                    equals: true,
                  },
                };
                break;
              case "pinned":
                whereItem = {
                  pin: {
                    gt: 0,
                  },
                };
                break;
              case "no-pinned":
                whereItem = {
                  pin: {
                    equals: 0,
                  },
                };
                break;
              case "secret-pinned":
                whereItem = {
                  pin: {
                    lt: 0,
                  },
                };
                break;
            }
            break;
          default:
            if (filterOptions.where) {
              whereItem = filterOptions.where(filterValue);
            } else {
              const key = filterOptions.key ?? filterKey;
              let filterEntry: filterConditionsAllKeyValue<any>;
              switch (filterValue) {
                case "true":
                case "false":
                  const bool = filterValue === "true";
                  if (!bool && filterTake) filterTake = undefined;
                  filterEntry = { bool };
                  break;
                default:
                  filterEntry = createFilterEntry(filterValue);
                  break;
              }
              whereItem = { [key]: filterEntry };
            }
            break;
        }
        if (typeof take !== "number" && typeof filterTake === "number") {
          take = filterTake;
        }
      }
      if (whereItem) {
        if (NOT) whereItem = { NOT: [whereItem] }
        where.push(whereItem);
      }
      if (OR_skip) {
        OR_skip = false;
      } else if (OR) {
        const current = where.pop();
        const before = where.pop();
        if (before?.OR) {
          before.OR.push(current);
          where.push(before);
        } else {
          where.push({
            OR: [before, current],
          });
        }
        OR = false;
      }
    }
  });
  return { where, id, take, orderBy };
}
