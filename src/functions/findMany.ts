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
