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
  Gemini: '#2563eb',  // Gemini Blue
  ChatGPT: '#0f766e', // ChatGPT Teal
  Claude: '#c2410c',  // Claude Orange
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
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
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
            color: '#0f172a',
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
            color: '#f1f5f9',
          },
        },
      },
    },
  }

  charts.set(canvas, new Chart(canvas, config))
}
