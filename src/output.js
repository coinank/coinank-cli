import chalk from 'chalk'
import Table from 'cli-table3'

// ─── Number formatters ───────────────────────────────────────────────────────

export function fmtNum(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—'
  return Number(n).toFixed(decimals)
}

export function fmtUsd(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—'
  const abs = Math.abs(n)
  if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return '$' + (n / 1e3).toFixed(2) + 'K'
  return '$' + Number(n).toFixed(decimals)
}

export function fmtPct(n, decimals = 4) {
  if (n == null || isNaN(n)) return '—'
  const val = Number(n) * 100
  const str = val.toFixed(decimals) + '%'
  return val > 0 ? chalk.green('+' + str) : val < 0 ? chalk.red(str) : str
}

export function fmtChange(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—'
  const val = Number(n)
  const str = (val > 0 ? '+' : '') + val.toFixed(decimals) + '%'
  return val > 0 ? chalk.green(str) : val < 0 ? chalk.red(str) : str
}

export function fmtTs(ms) {
  if (!ms) return '—'
  return new Date(Number(ms)).toLocaleString()
}

// ─── Output modes ────────────────────────────────────────────────────────────

export function outputJson(data) {
  console.log(JSON.stringify(data, null, 2))
}

export function outputCsv(rows, headers) {
  console.log(headers.join(','))
  for (const row of rows) {
    console.log(row.map((v) => (String(v).includes(',') ? `"${v}"` : v)).join(','))
  }
}

export function makeTable(head, colWidths) {
  return new Table({
    head: head.map((h) => chalk.cyan(h)),
    colWidths,
    style: { border: ['grey'], head: [] },
  })
}
