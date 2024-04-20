import { EventEmitter } from "node:events"

/**
 * Attaches event listeners to a promise
 * @param promise
 * @returns
 */

export function attachEvents<T>(
  fn: (emitter: EventEmitter) => Promise<T>
): Promise<T> & EventEmitter {
  const emitter = new EventEmitter()

  fn(emitter).then(
    result => {
      emitter.emit("complete", result)
    },
    error => {
      emitter.emit("error", error)
    }
  )

  const promise = new Promise<T>((resolve, reject) => {
    emitter.on("complete", resolve)
    emitter.on("error", reject)
  })

  return Object.assign(promise, emitter)
}
