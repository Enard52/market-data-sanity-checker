import { describe, expect, it } from 'vitest'
import {
  buildReleaseNotes,
  changelogSection,
  checkReleaseNotes,
  contributors,
  firstSentence,
} from '../scripts/release-notes'

const CHANGELOG = `# market-data-sanity-checker

## 2.0.0

### Major Changes

- abc1234: The \`check\` command now exits 3 on a structural error. Scripts that matched exit 2 must update.

### Minor Changes

- def5678: New rule \`FOO\` reports bars that foo. Thanks @alice and @bob-2.

### Patch Changes

- 0a1b2c3: Fix the bar. Credit to @carol.
  A second line of the same entry.

## 1.9.0

### Patch Changes

- 1111111: Older entry.
`

describe('release notes', () => {
  it('extracts one version section and fails on a missing one', () => {
    expect(changelogSection(CHANGELOG, '1.9.0')).toBe('### Patch Changes\n\n- 1111111: Older entry.')
    expect(() => changelogSection(CHANGELOG, '3.0.0')).toThrow('no "## 3.0.0" section')
  })

  it('takes the first sentence without markdown emphasis', () => {
    expect(firstSentence('**New:** rule `FOO` is here. More text.')).toBe('New: rule `FOO` is here')
    expect(firstSentence('No full stop')).toBe('No full stop')
  })

  it('collects thanked and credited handles once, in order', () => {
    expect(contributors(['Thanks @alice and @bob-2.', 'Credit to @carol. thanks @alice'])).toEqual(['@alice', '@bob-2', '@carol'])
  })

  it('builds the title and the house-format body', () => {
    const notes = buildReleaseNotes(CHANGELOG, '2.0.0')
    expect(notes.title).toBe('v2.0.0 — The `check` command now exits 3 on a structural error')
    expect(notes.body).toContain('Also 2 more changes, listed below.')
    expect(notes.body).not.toContain('No breaking changes.')
    expect(notes.body.indexOf('### Breaking changes and upgrade')).toBeLessThan(notes.body.indexOf('### Added'))
    expect(notes.body.indexOf('### Added')).toBeLessThan(notes.body.indexOf('### Changed and fixed'))
    expect(notes.body).toContain('- Fix the bar. Credit to @carol.\n  A second line of the same entry.')
    expect(notes.body).not.toMatch(/abc1234|def5678/)
    expect(notes.body).toContain('Thank you @alice, @bob-2, @carol.')
    expect(notes.body).toContain('npm view market-data-sanity-checker@2.0.0 dist.attestations')
    expect(checkReleaseNotes(notes.body, notes.title)).toEqual([])
  })

  it('says there are no breaking changes when there is no major entry', () => {
    const notes = buildReleaseNotes(CHANGELOG, '1.9.0')
    expect(notes.body).toContain('No breaking changes.')
    expect(notes.body).not.toContain('### Contributors')
    expect(notes.title).toBe('v1.9.0 — Older entry')
  })

  it('shortens a long title at a word boundary', () => {
    const long = `## 1.0.0\n\n### Patch Changes\n\n- 1234567: ${'word '.repeat(40)}end.\n`
    const { title } = buildReleaseNotes(long, '1.0.0')
    expect(title.length).toBeLessThanOrEqual(90)
    expect(title.endsWith('…')).toBe(true)
  })

  it.each([
    ['### Added\n\n- x\n\n### Verify\n', 'no summary paragraph'],
    ['Summary.\n\n### Added\n\n- x\n', 'no "### Verify" section'],
    ['Summary, thanks @dan.\n\n### Verify\n', 'no "### Contributors" section'],
    ['Summary.\n\nGenerated with Claude Code\n\n### Verify\n', 'AI attribution'],
  ])('flags a body that breaks the format: %j', (body, problem) => {
    expect(checkReleaseNotes(body).join('\n')).toContain(problem)
  })

  it('flags a title without the version and summary', () => {
    expect(checkReleaseNotes('Summary.\n\n### Verify\n', 'v1.5.1')).toEqual(['title is not "vX.Y.Z — <summary>"'])
    expect(checkReleaseNotes('Summary.\n\n### Verify\n', 'v1.6.0-rc.1 — Release candidate')).toEqual([])
  })
})
