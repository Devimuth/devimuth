/**
 * Diff utilities using diff-match-patch library
 */
import DiffMatchPatch from 'diff-match-patch'

const dmp = new DiffMatchPatch()

/**
 * Helper function to perform line-based diff using diff-match-patch
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Array of diff tuples [operation, text]
 */
function diffLineMode(text1: string, text2: string): [number, string][] {
  const a = dmp.diff_linesToChars_(text1, text2)
  const lineText1 = a.chars1
  const lineText2 = a.chars2
  const lineArray = a.lineArray
  const diffs = dmp.diff_main(lineText1, lineText2, false)
  dmp.diff_charsToLines_(diffs, lineArray)
  return diffs
}

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged'
  text: string
  lineNumber?: number
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  text: string
  oldLineNumber?: number
  newLineNumber?: number
}

/**
 * Compute diff between two texts
 * @param oldText - Original text
 * @param newText - New text
 * @param mode - Diff mode: 'line', 'word', or 'char'
 * @returns Array of diff results
 */
export function computeDiff(
  oldText: string,
  newText: string,
  mode: 'line' | 'word' | 'char' = 'line'
): DiffResult[] {
  let diffs: [number, string][]

  switch (mode) {
    case 'line':
      diffs = diffLineMode(oldText, newText)
      break
    case 'word':
      diffs = dmp.diff_main(oldText, newText, false)
      dmp.diff_cleanupSemantic(diffs)
      break
    case 'char':
      diffs = dmp.diff_main(oldText, newText, false)
      break
    default:
      diffs = dmp.diff_main(oldText, newText, false)
  }

  const results: DiffResult[] = []
  let lineNumber = 1

  for (const [operation, text] of diffs) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (i < lines.length - 1) {
        // Add newline back except for last line
        const lineWithNewline = line + '\n'
        if (operation === 1) {
          // Added
          results.push({ type: 'added', text: lineWithNewline, lineNumber })
        } else if (operation === -1) {
          // Removed
          results.push({ type: 'removed', text: lineWithNewline, lineNumber })
        } else {
          // Unchanged
          results.push({ type: 'unchanged', text: lineWithNewline, lineNumber })
          lineNumber++
        }
      } else if (line) {
        // Last line (might be empty)
        if (operation === 1) {
          results.push({ type: 'added', text: line, lineNumber })
        } else if (operation === -1) {
          results.push({ type: 'removed', text: line, lineNumber })
        } else {
          results.push({ type: 'unchanged', text: line, lineNumber })
          lineNumber++
        }
      }
    }
  }

  return results
}

/**
 * Compute line-by-line diff with line numbers
 * @param oldText - Original text
 * @param newText - New text
 * @returns Array of diff lines with line numbers
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const diffs = diffLineMode(oldText, newText)

  const results: DiffLine[] = []
  let oldLineNum = 1
  let newLineNum = 1

  for (const [operation, text] of diffs) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (i < lines.length - 1 || (i === lines.length - 1 && line)) {
        if (operation === 1) {
          // Added
          results.push({
            type: 'added',
            text: line,
            newLineNumber: newLineNum++,
          })
        } else if (operation === -1) {
          // Removed
          results.push({
            type: 'removed',
            text: line,
            oldLineNumber: oldLineNum++,
          })
        } else {
          // Unchanged
          results.push({
            type: 'unchanged',
            text: line,
            oldLineNumber: oldLineNum++,
            newLineNumber: newLineNum++,
          })
        }
      }
    }
  }

  return results
}

/**
 * Format unified diff
 * @param oldText - Original text
 * @param newText - New text
 * @param oldFile - Original file name (optional)
 * @param newFile - New file name (optional)
 * @returns Unified diff format string
 */
export function formatUnifiedDiff(
  oldText: string,
  newText: string,
  oldFile: string = 'old',
  newFile: string = 'new'
): string {
  const diffs = diffLineMode(oldText, newText)

  let output = `--- ${oldFile}\n+++ ${newFile}\n`
  let oldLineNum = 1
  let newLineNum = 1
  let hunkStartOld = 1
  let hunkStartNew = 1
  let hunkLines: string[] = []

  for (const [operation, text] of diffs) {
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (i < lines.length - 1 || (i === lines.length - 1 && line)) {
        if (operation === 1) {
          // Added
          hunkLines.push(`+${line}`)
          newLineNum++
        } else if (operation === -1) {
          // Removed
          hunkLines.push(`-${line}`)
          oldLineNum++
        } else {
          // Unchanged
          if (hunkLines.length > 0) {
            // Output hunk
            output += `@@ -${hunkStartOld},${oldLineNum - hunkStartOld} +${hunkStartNew},${newLineNum - hunkStartNew} @@\n`
            output += hunkLines.join('\n') + '\n'
            hunkLines = []
          }
          hunkStartOld = oldLineNum + 1
          hunkStartNew = newLineNum + 1
          oldLineNum++
          newLineNum++
        }
      }
    }
  }

  // Output remaining hunk
  if (hunkLines.length > 0) {
    output += `@@ -${hunkStartOld},${oldLineNum - hunkStartOld} +${hunkStartNew},${newLineNum - hunkStartNew} @@\n`
    output += hunkLines.join('\n') + '\n'
  }

  return output
}

/**
 * Format HTML diff
 * @param oldText - Original text
 * @param newText - New text
 * @returns HTML string with diff highlighting
 */
export function formatHTMLDiff(oldText: string, newText: string): string {
  const diffs = dmp.diff_main(oldText, newText, false)
  dmp.diff_cleanupSemantic(diffs)

  let html = '<div class="diff-container">\n'
  for (const [operation, text] of diffs) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
    if (operation === 1) {
      html += `<span class="diff-added">${escaped}</span>`
    } else if (operation === -1) {
      html += `<span class="diff-removed">${escaped}</span>`
    } else {
      html += `<span class="diff-unchanged">${escaped}</span>`
    }
  }
  html += '\n</div>'
  return html
}

