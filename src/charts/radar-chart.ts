import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import type { ChartConfiguration } from 'chart.js'
import { DIMENSIONS } from '@/data/skills'
import type { Skill } from '@/data/types'

Chart.register(
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
)

const charts = new WeakMap<HTMLCanvasElement, Chart>()
const palette = ['#2563eb', '#0d9488', '#ea580c'] // Gemini Blue, ChatGPT Teal, Claude Orange

export function drawRadarChart(canvas: HTMLCanvasElement, skills: Skill[]): void {
  charts.get(canvas)?.destroy()

  const config: ChartConfiguration<'radar'> = {
    type: 'radar',
    data: {
      labels: DIMENSIONS.map((dimension) => dimension.label),
      datasets: skills.map((skill, index) => {
        const color = palette[index % palette.length]

        return {
          label: skill.name,
          data: DIMENSIONS.map((dimension) => skill[dimension.key]),
          borderColor: color,
          backgroundColor: `${color}16`, // Muted fill opacity
          borderWidth: 2,
          pointBackgroundColor: color,
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      }),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            usePointStyle: true,
            color: '#334155',
            padding: 16,
            font: {
              size: 11,
              weight: 500,
            },
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 8,
          cornerRadius: 6,
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.formattedValue} / 5`,
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1,
            color: '#64748b',
            backdropColor: 'transparent',
            font: {
              size: 9,
            },
          },
          angleLines: {
            color: '#e2e8f0',
          },
          grid: {
            color: '#e2e8f0',
          },
          pointLabels: {
            color: '#1e293b',
            font: {
              size: 12,
              weight: 600,
            },
          },
        },
      },
    },
  }

  charts.set(canvas, new Chart(canvas, config))
}
