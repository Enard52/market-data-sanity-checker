export interface ScoreboardProviderResult {
  provider: string
  symbols_ok: number
  symbols_failed: number
  symbols_skipped: number
  mean_score: number
  min_score: number
  worst_symbols: Array<{ symbol: string; score: number; rules: string[] }>
  total_findings: Record<string, number>
}

export interface SkippedProvider {
  provider: string
  symbols: string[]
}

interface ExcludedProvider {
  provider: string
  failed: number
}

interface ScoreboardReadmeInput {
  generatedAt: string
  basketSize: number
  providers: ScoreboardProviderResult[]
  excluded: ExcludedProvider[]
  skipped: SkippedProvider[]
  comparisons: unknown[]
}

/** Render the checked-in weekly scoreboard README without touching provider data. */
export function renderScoreboardReadme({
  generatedAt,
  basketSize,
  providers,
  excluded,
  skipped,
  comparisons,
}: ScoreboardReadmeInput): string {
  const lines = [
    '# Provider scoreboard',
    '',
    `Generated: ${generatedAt} · basket: ${basketSize} liquid symbols · range: 1y · reproducible with \`pnpm scoreboard\``,
    '',
    '| Provider | Symbols | Mean sanity score | Min | Critical | Warning | Info |',
    '|---|---|---|---|---|---|---|',
    ...providers.map(
      (result) =>
        `| ${result.provider} | ${result.symbols_ok} (+${result.symbols_failed} failed${result.symbols_skipped > 0 ? `, ${result.symbols_skipped} skipped: daily cap` : ''}) | ${result.mean_score} | ${result.min_score} | ${result.total_findings.critical} | ${result.total_findings.warning} | ${result.total_findings.info} |`,
    ),
    ...(skipped.length > 0
      ? ['', ...skipped.map((entry) => `- ${entry.provider} skipped (daily request cap): ${entry.symbols.join(', ')}`)]
      : []),
    ...(excluded.length > 0
      ? [
          '',
          `Excluded this run (more than 20% of fetches failed, so none of their numbers are published): ${excluded
            .map((entry) => `${entry.provider} (${entry.failed}/${basketSize} failed)`)
            .join(', ')}`,
        ]
      : []),
    '',
    '## Worst-scoring symbols per provider',
    '',
    ...providers.flatMap((result) => [
      `### ${result.provider}`,
      '',
      ...result.worst_symbols.map(
        (entry) => `- **${entry.symbol}** — ${entry.score}/100${entry.rules.length > 0 ? ` (${entry.rules.join(', ')})` : ' (clean)'}`,
      ),
      '',
    ]),
    comparisons.length > 0 ? `## Cross-provider consistency\n\n\`\`\`json\n${JSON.stringify(comparisons, null, 2)}\n\`\`\`\n` : '',
  ]
  return lines.join('\n')
}
