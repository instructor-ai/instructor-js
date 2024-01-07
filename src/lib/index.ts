export function omit<T extends object, K extends keyof T>(keys: K[], obj: T): Omit<T, K> {
  const result = {} as Omit<T, K>
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keys.includes(key as unknown as K)) {
      result[key as unknown as Exclude<keyof T, K>] = obj[key] as unknown as T[Exclude<keyof T, K>]
    }
  }
  return result
}
