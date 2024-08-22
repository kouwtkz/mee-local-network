export async function using<T extends Object, U>(instance: T, fn: (instance: T) => Promise<U>) {
  const result = await fn(instance);
  if (("dispose" in instance) && (typeof instance.dispose === "function")) instance.dispose()
  return result
}
