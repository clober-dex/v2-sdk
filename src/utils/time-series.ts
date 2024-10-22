export function fillAndSortByTimestamp<
  T extends { timestamp: number | bigint },
>(
  data: T[],
  granularity: number,
  emptyObjectGenerator: (timestamp: number, prev: T) => T,
): T[] {
  const sortedData = data.sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  )

  const result: T[] = []

  for (let i = 0; i < sortedData.length; i++) {
    result.push(sortedData[i])

    if (i < sortedData.length - 1) {
      const currentTimestamp = sortedData[i].timestamp
      const nextTimestamp = sortedData[i + 1].timestamp
      for (
        let ts = Number(currentTimestamp) + granularity;
        ts < Number(nextTimestamp);
        ts += granularity
      ) {
        result.push(emptyObjectGenerator(ts, sortedData[i]))
      }
    }
  }

  return result
}
