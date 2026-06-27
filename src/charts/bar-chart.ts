import {
  BarElement,
  BarController,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import type { Vendor } from '@/data/types'

Chart.register(
  BarElement,
  BarController,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
)

export interface VendorAverage {
  vendor: Vendor
  score: number
  practicality: number
  accessibility: number
  maturity: number
  uniqueness: number
}

const charts = new WeakMap<HTMLCanvasElement, Chart>()
const colors: Record<Vendor, string> = {
  Gemini: '#315b8c',
  ChatGPT: '#28705f',
  Claude: '#9a5b22',
}

export function drawVendorBarChart(
  canvas: HTMLCanvasElement,
  rows: VendorAverage[],
): void {
  charts.get(canvas)?.destroy()

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: rows.map((row) => row.vendor),
      datasets: [
        {
          label: '含金量總分平均',
          data: rows.map((row) => row.score),
          backgroundColor: rows.map((row) => colors[row.vendor]),
          borderRadius: 4,
          barThickness: 32,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Clean look, title says it all
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#202733',
          bodyColor: '#475467',
          borderColor: '#d8dee7',
          borderWidth: 1,
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label: (item) => ` 平均總分: ${item.formattedValue} 分`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#475467',
            font: {
              size: 13,
              weight: 600,
            },
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: '#64748b',
            font: {
              size: 11,
            },
          },
          grid: {
            color: '#edf1f5',
          },
        },
      },
    },
  }

  charts.set(canvas, new Chart(canvas, config))
}
