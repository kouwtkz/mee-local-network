export function ObjRecursion(str: string, obj?: KeyValueAnyType) {
  if (typeof obj !== "object") obj = {};
  str.split(".").reduce((a, c) => {
    if (!a[c]) a[c] = {};
    return a[c];
  }, obj)
  return obj;
}
