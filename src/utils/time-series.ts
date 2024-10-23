export function fillAndSortByTimestamp<
  T extends { timestamp: number | bigint },
>(
  data: T[],
  granularity: number,
  fromTimestamp: number,
  toTimestamp: number,
  emptyObjectGenerator: (timestamp: number, prev: T | null) => T,
): T[] {
  const sortedData = data.sort(
    (a, b) => Number(a.timestamp) - Number(b.timestamp),
  )

  if (
    sortedData.findIndex((d) => Number(d.timestamp) === fromTimestamp) === -1
  ) {
    const before =
      sortedData.filter((d) => Number(d.timestamp) < fromTimestamp).pop() ||
      null
    sortedData.unshift(emptyObjectGenerator(fromTimestamp, before))
  }

  if (sortedData.findIndex((d) => Number(d.timestamp) === toTimestamp) === -1) {
    const before =
      sortedData.filter((d) => Number(d.timestamp) < toTimestamp).pop() || null
    null
    sortedData.push(emptyObjectGenerator(toTimestamp, before))
  }

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

  return result.filter(
    (d) =>
      Number(d.timestamp) >= fromTimestamp &&
      Number(d.timestamp) <= toTimestamp,
  )
}
