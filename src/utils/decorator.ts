export function decorator<Args extends any[], R>(
  fn: (...a: Args) => R,
): (...a: Args) => R {
  return function (...a: Args) {
    return fn(...a)
  }
}
