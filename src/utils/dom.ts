/** 安全取得 DOM 元素，找不到時拋錯 */
export function qs<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector)
  if (!el) throw new Error(`Element not found: ${selector}`)
  return el
}

/** 查詢所有符合的元素 */
export function qsa<T extends HTMLElement>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector))
}

/** 建立元素並設定屬性 */
export function create<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v)
  }
  return el
}

/** 動畫計數器：從 0 滾動到目標數字 */
export function animateCounter(el: HTMLElement, target: number): void {
  const duration = 1200
  const start = performance.now()

  function tick(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    el.textContent = Math.round(target * eased).toString()
    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

/** 避免 XSS 的字串跳脫函式 */
export function escapeHTML(str: string): string {
  if (!str) return ''
  return str.replace(/[&<>'"]/g, (tag) => {
    const chars: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    }
    return chars[tag] || tag
  })
}

/** 延遲觸發函式 (Debounce) */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  } as T
}

