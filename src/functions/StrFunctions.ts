export function toUpperFirstCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function CompactCode(value: any) {
  return String(value).replace(/\s+/g, " ")
}