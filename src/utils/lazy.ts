const lazyCache = new Map<(...args: any[]) => any, any>()

export default <T extends (...args: any[]) => any>(factory: T) => (
  ...args: Parameters<T>
): ReturnType<T> => {
  if (lazyCache.has(factory)) return lazyCache.get(factory)
  const resource = factory(...args)
  lazyCache.set(factory, resource)
  return resource
}
