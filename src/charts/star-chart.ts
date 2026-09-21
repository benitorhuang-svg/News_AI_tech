import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
import type { GitHubRepo } from '@/data/types'
import { CATEGORY_COLOR_MAP } from '@/data/github-trending'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export function drawStarChart(canvas: HTMLCanvasElement, repos: GitHubRepo[]): void {
  const sorted = [...repos]
    .filter((r) => r.starsWeekly > 0)
    .sort((a, b) => b.starsWeekly - a.starsWeekly)
    .slice(0, 15)

  if (sorted.length === 0) return

  const labels = sorted.map((r) => r.label)
  const data = sorted.map((r) => r.starsWeekly)
  const colors = sorted.map((r) => CATEGORY_COLOR_MAP[r.category] ?? '#667085')

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '週增 ⭐',
          data,
          backgroundColor: colors.map((c) => c + '99'),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `+${ctx.parsed.x.toLocaleString()} ⭐ this week`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#e2e8f022' },
          ticks: {
            color: '#667085',
            font: { size: 11 },
          },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: '#202733',
            font: { size: 11, weight: 'bold' },
          },
        },
      },
    },
  })
}
