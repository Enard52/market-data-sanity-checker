import type { Finding, SanityReport } from './types'
import type { ComparisonReport } from '../compare/comparator'

export function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll(/\r?\n/g, ' ')
}

function formatDate(where: Finding['where']): string {
  if (!where || where.date === undefined || where.date === null) return '-'
  return String(where.date)
}

/** Renders a single-source SanityReport as Markdown suitable for PR comments or GITHUB_STEP_SUMMARY. */
export function renderReportMarkdown(report: SanityReport): string {
  const lines: string[] = []
  lines.push(`## ${report.symbol} (${report.source}) — sanity_score: ${report.sanity_score}/100`)
  lines.push('')
  if (report.findings.length === 0) {
    lines.push('No findings.')
  } else {
    lines.push('| Rule | Severity | Date | Explanation |')
    lines.push('|---|---|---|---|')
    for (const finding of report.findings) {
      const rule = escapeCell(finding.rule)
      const severity = escapeCell(finding.severity)
      const date = escapeCell(formatDate(finding.where))
      const explanation = escapeCell(finding.explanation)
      lines.push(`| ${rule} | ${severity} | ${date} | ${explanation} |`)
    }
  }
  return lines.join('\n')
}

/** Renders a ComparisonReport as Markdown suitable for PR comments or GITHUB_STEP_SUMMARY. */
export function renderCompareMarkdown(report: ComparisonReport): string {
  const [sourceA, sourceB] = report.sources
  const lines: string[] = []
  lines.push(`## ${report.symbol} — ${sourceA} vs ${sourceB} — consistency_score: ${report.consistency_score}/100`)
  lines.push('')
  if (report.findings.length === 0) {
    lines.push('No findings.')
  } else {
    lines.push('| Rule | Severity | Date | Explanation |')
    lines.push('|---|---|---|---|')
    for (const finding of report.findings) {
      const rule = escapeCell(finding.rule)
      const severity = escapeCell(finding.severity)
      const date = escapeCell(formatDate(finding.where))
      const explanation = escapeCell(finding.explanation)
      lines.push(`| ${rule} | ${severity} | ${date} | ${explanation} |`)
    }
  }
  return lines.join('\n')
}
