const METRICS_URL = "https://dupe.bytedance.net/self_help/api/proxy_metrics"

type MetricValue = string | number | boolean | null | undefined

interface MetricPayload {
  name: string
  value: MetricValue
  tags?: Record<string, string>
}

function convertToString(value: MetricValue): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function convertTagsToString(tags: Record<string, MetricValue>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tags)) {
    result[key] = convertToString(value)
  }
  return result
}

function isProduction(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.location.hostname === 'dupe.bytedance.net'
}

export function trackMetric(name: string, value: MetricValue, tags?: Record<string, MetricValue>): void {
  if (!isProduction()) {
    return
  }

  const payload: MetricPayload = {
    name,
    value,
    tags: tags ? convertTagsToString(tags) : undefined,
  }

  fetch(METRICS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Ignore errors, don't block main thread
  })
}

export function trackCalMetric(event: string, payload: Record<string, MetricValue> = {}): void {
  const mergedPayload = {
    tool: 'cal',
    path: typeof window !== 'undefined' ? window.location.pathname : '',
    ts: Date.now(),
    ...payload,
  }

  trackMetric(event, 1, mergedPayload)
}

export function trackCalculatorCardClick(calculatorType: string): void {
  trackCalMetric('cal_card_click', {
    calculator_type: calculatorType,
  })
}
