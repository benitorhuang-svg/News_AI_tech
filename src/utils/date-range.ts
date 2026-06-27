const DAY_MS = 24 * 60 * 60 * 1000

export const RECENT_DAY_OPTIONS = [7, 30, 60, 90] as const
export type RecentDays = (typeof RECENT_DAY_OPTIONS)[number]

export function isRecentDays(value: number): value is RecentDays {
  return RECENT_DAY_OPTIONS.includes(value as RecentDays)
}

export function latestIsoDate(values: string[]): string {
  return values.reduce((latest, value) => (value > latest ? value : latest), '')
}

export function recentDateRange(endDate: string, days: number): { from: string; to: string } {
  const endTime = Date.parse(`${endDate}T00:00:00Z`)
  const startTime = endTime - Math.max(0, days - 1) * DAY_MS

  return {
    from: new Date(startTime).toISOString().slice(0, 10),
    to: endDate,
  }
}
