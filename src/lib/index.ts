export function omit<T extends object, K extends keyof T>(keys: K[], obj: T): Omit<T, K> {
  const result = {} as Omit<T, K>
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && !keys.includes(key as unknown as K)) {
      result[key as unknown as Exclude<keyof T, K>] = obj[key] as unknown as T[Exclude<keyof T, K>]
    }
  }
  return result
}

export async function iterableTee<T>(
  iterable: AsyncIterable<T>,
  n: number
): Promise<AsyncGenerator<T>[]> {
  const buffers: T[][] = Array.from({ length: n }, () => [])
  const resolvers: (() => void)[] = []
  const iterator = iterable[Symbol.asyncIterator]()
  let done = false

  async function* reader(index: number) {
    while (true) {
      if (buffers[index].length > 0) {
        yield buffers[index].shift()!
      } else if (done) {
        break
      } else {
        await new Promise<void>(resolve => resolvers.push(resolve))
      }
    }
  }

  ;(async () => {
    for await (const item of {
      [Symbol.asyncIterator]: () => iterator
    }) {
      for (const buffer of buffers) {
        buffer.push(item)
      }

      while (resolvers.length > 0) {
        resolvers.shift()!()
      }
    }
    done = true
    while (resolvers.length > 0) {
      resolvers.shift()!()
    }
  })()

  return Array.from({ length: n }, (_, i) => reader(i))
}
