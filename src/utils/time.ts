export const currentTimestampInSeconds = (): number =>
  Math.floor(new Date().getTime() / 1000)

export const getDeadlineTimestampInSeconds = (): bigint => {
  return BigInt(Math.floor(currentTimestampInSeconds() + 60 * 20))
}

export const getDailyStartTimestampInSeconds = (
  timestampInSeconds: number,
): number => {
  return Math.floor(timestampInSeconds / 86400) * 86400
}
