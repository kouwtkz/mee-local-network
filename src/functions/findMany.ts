import { AutoAllotDate } from "./DateFunctions";

export function findMany<T>({ list, where, take, orderBy, skip = 0 }: findManyProps<T>): T[] {
  if (!list) return [];
  orderBy?.reverse().forEach((args) =>
    Object.entries(args).forEach(([k, v]) => {
      switch (v) {
        case "asc":
          list.sort(
            (a: any, b: any) => a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0)
          break;
        case "desc":
          list.sort(
            (a: any, b: any) => a[k] < b[k] ? 1 : a[k] > b[k] ? -1 : 0)
          break;
      }
    })
  );
  let i = 0;
  return list.filter((value) => {
    if (take !== undefined && i >= (take + skip)) return false;
    const result = whereLoop(value, where);
    if (result) i++;
    return result && i > skip;
  })
}

function whereLoop<T>(value: T, where: findWhereType<T> | undefined): boolean {
  function recursion(__where: findWhereType<T>): boolean {
    return Object.entries(__where).every(([fkey, fval]) => {
      const fvalWheres: findWhereType<T>[] = fval;
      switch (fkey) {
        case "AND":
          return fvalWheres.every((_val) => recursion(_val))
        case "OR":
          return fvalWheres.some((_val) => recursion(_val))
        default:
          const _value: any = value;
          const cval = _value[fkey];
          if (typeof (fval) === "object") {
            const _conditions: [any, any][] = Object.entries(fval);
            const conditions: [filterConditionsType | filterConditionsStringType, any][] = _conditions;
            return (conditions).every(([k, v]) => {
              switch (k) {
                case "equals":
                  return cval == v;
                case "not":
                  return cval != v;
                case "contains":
                  if (Array.isArray(cval)) return cval.some(x => x === v);
                  else if (typeof v === "object" && "test" in v) return v.test(cval);
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
                default:
                  return false;
              }
            })
          } else {
            return cval == fval;
          }
      }
    })
  }
  return where ? recursion(where) : true;
}

export function setWhere<T>(q: string, options: WhereOptionsType<T> = {}) {
  const textKey = options.keys?.text || "text"
  const fromKey = options.keys?.from || "name"
  const hiddenOption = options.hidden || { draft: false }
  const where: findWhereType<any>[] = [];
  let id: number | undefined;
  let take: number | undefined;
  const orderBy: OrderByItem[] = [];
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
        [textKey]: {
          contains: new RegExp(`#${filterValue.replace(/(\+)/g, "\\$1")}(\\s|$)`, "i")
        }
      })
    } else {
      const colonIndex = item.indexOf(":");
      const filterKey = colonIndex >= 0 ? item.slice(0, colonIndex).toLocaleLowerCase() : "";
      const filterValue = item.slice(filterKey.length + 1);
      switch (filterKey) {
        case "":
          if (item)
            where.push(
              {
                [textKey]: {
                  contains: item
                }
              })
          break;
        case "id":
          id = Number(filterValue);
          break;
        case "take":
          take = Number(filterValue);
          break;
        case "order":
          const orderValue = filterValue.toLocaleLowerCase()
          switch (orderValue) {
            case "asc":
            case "desc":
              orderBy.push({ date: orderValue });
              break;
          }
          break;
        case "sort":
          const sortOrder = filterValue.includes("!");
          const sortKey = sortOrder ? filterValue.replace("!", "") : filterValue;
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
        case "title":
        case "body":
        case "text":
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
              [textKey]: {
                contains: `#${filterValue}`
              }
            })
          break;
        case 'from':
          where.push(
            {
              [fromKey]: {
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
                  [textKey]: {
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
          switch (typeof options[filterKey]) {
            case "function":
              where.push(options[filterKey](filterValue));
              break;
            default:
              where.push(
                {
                  [options[filterKey] ?? filterKey]: {
                    equals: filterValue
                  }
                })
              break;
          }
          break;
      }
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
  return { where, id, take, orderBy };
}