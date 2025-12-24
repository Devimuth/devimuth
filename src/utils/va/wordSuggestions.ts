// Word choice suggestions for professional communication

export interface WordSuggestion {
  original: string
  suggestion: string
  reason: string
  position: number
  context: string
}

// Dictionary of casual/informal words and their professional alternatives
const wordReplacements: Record<string, { professional: string; reason: string }> = {
  'happy': { professional: 'pleased', reason: 'More formal and professional' },
  'thanks': { professional: 'thank you', reason: 'More formal and complete' },
  'hey': { professional: 'hello', reason: 'More professional greeting' },
  'hi': { professional: 'hello', reason: 'Slightly more formal' },
  'yeah': { professional: 'yes', reason: 'More professional' },
  'yep': { professional: 'yes', reason: 'More professional' },
  'nope': { professional: 'no', reason: 'More professional' },
  'gonna': { professional: 'going to', reason: 'Use complete words in professional communication' },
  'wanna': { professional: 'want to', reason: 'Use complete words in professional communication' },
  'gotta': { professional: 'have to', reason: 'Use complete words in professional communication' },
  'kinda': { professional: 'kind of', reason: 'Use complete words in professional communication' },
  'sorta': { professional: 'sort of', reason: 'Use complete words in professional communication' },
  'lemme': { professional: 'let me', reason: 'Use complete words in professional communication' },
  'gimme': { professional: 'give me', reason: 'Use complete words in professional communication' },
  'cause': { professional: 'because', reason: 'Use complete words in professional communication' },
  'cos': { professional: 'because', reason: 'Use complete words in professional communication' },
  'cuz': { professional: 'because', reason: 'Use complete words in professional communication' },
  'thru': { professional: 'through', reason: 'Use complete words in professional communication' },
  'tho': { professional: 'though', reason: 'Use complete words in professional communication' },
  'ur': { professional: 'your', reason: 'Avoid text message abbreviations' },
  'u': { professional: 'you', reason: 'Avoid text message abbreviations' },
  'r': { professional: 'are', reason: 'Avoid text message abbreviations' },
  'lol': { professional: '', reason: 'Avoid internet slang in professional emails' },
  'omg': { professional: '', reason: 'Avoid internet slang in professional emails' },
  'btw': { professional: 'by the way', reason: 'Avoid abbreviations' },
  'fyi': { professional: 'for your information', reason: 'Spell out abbreviations' },
  'asap': { professional: 'as soon as possible', reason: 'Spell out abbreviations' },
  'etc': { professional: 'and so on', reason: 'More formal alternative' },
  'stuff': { professional: 'items', reason: 'More specific and professional' },
  'thing': { professional: 'item', reason: 'More specific and professional' },
  'things': { professional: 'items', reason: 'More specific and professional' },
  'cool': { professional: 'excellent', reason: 'More professional' },
  'awesome': { professional: 'excellent', reason: 'More professional' },
  'great': { professional: 'excellent', reason: 'More professional (in some contexts)' },
  'sure': { professional: 'certainly', reason: 'More formal' },
  'ok': { professional: 'okay', reason: 'Slightly more formal' },
  'okay': { professional: 'understood', reason: 'More professional acknowledgment' },
  'yay': { professional: 'excellent', reason: 'More professional' },
  'haha': { professional: '', reason: 'Avoid casual expressions' },
  'hahaha': { professional: '', reason: 'Avoid casual expressions' },
  'lmao': { professional: '', reason: 'Avoid internet slang' },
  'tbh': { professional: 'to be honest', reason: 'Spell out abbreviations' },
  'imo': { professional: 'in my opinion', reason: 'Spell out abbreviations' },
  'fwiw': { professional: 'for what it\'s worth', reason: 'Spell out abbreviations' },
  'np': { professional: 'you\'re welcome', reason: 'More complete and professional' },
  'no problem': { professional: 'you\'re welcome', reason: 'More formal' },
  'no worries': { professional: 'you\'re welcome', reason: 'More formal' },
  'cheers': { professional: 'best regards', reason: 'More formal closing' },
  'ciao': { professional: 'best regards', reason: 'More professional closing' },
  'later': { professional: 'best regards', reason: 'More professional closing' },
  'bye': { professional: 'best regards', reason: 'More professional closing' },
  'gotcha': { professional: 'understood', reason: 'More professional' },
  'i see': { professional: 'i understand', reason: 'More formal' },
  'i get it': { professional: 'i understand', reason: 'More formal' },
  'makes sense': { professional: 'that is logical', reason: 'More formal' },
  'sounds good': { professional: 'that sounds acceptable', reason: 'More formal' },
  'works for me': { professional: 'that works for me', reason: 'Slightly more formal' },
  'deal': { professional: 'agreed', reason: 'More professional' },
  'sweet': { professional: 'excellent', reason: 'More professional' },
  'rad': { professional: 'excellent', reason: 'More professional' },
  'wicked': { professional: 'excellent', reason: 'More professional' },
}

// Context-aware word suggestions
export function getWordSuggestions(text: string): WordSuggestion[] {
  const suggestions: WordSuggestion[] = []

  // Check for casual/informal words
  Object.entries(wordReplacements).forEach(([casual, replacement]) => {
    const regex = new RegExp(`\\b${casual}\\b`, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) {
      const position = match.index
      const context = getContext(text, position, 30)
      
      // Skip if it's part of a professional phrase (e.g., "happy to help" in professional context)
      if (casual === 'happy' && /happy\s+to\s+(help|assist|answer|discuss)/i.test(context)) {
        return // Skip this match
      }
      
      suggestions.push({
        original: match[0],
        suggestion: replacement.professional,
        reason: replacement.reason,
        position,
        context,
      })
    }
  })

  // Check for excessive exclamation marks (more than 2 in a row)
  const exclamationRegex = /!{3,}/g
  let match
  while ((match = exclamationRegex.exec(text)) !== null) {
    suggestions.push({
      original: match[0],
      suggestion: '!',
      reason: 'Reduce excessive exclamation marks for professional tone',
      position: match.index,
      context: getContext(text, match.index, 20),
    })
  }

  // Check for all caps (likely emphasis)
  const allCapsRegex = /\b[A-Z]{3,}\b/g
  while ((match = allCapsRegex.exec(text)) !== null) {
    // Skip common acronyms
    if (!['FYI', 'ASAP', 'CEO', 'CFO', 'HR', 'IT', 'API', 'URL', 'PDF', 'HTML', 'CSS', 'JS'].includes(match[0])) {
      suggestions.push({
        original: match[0],
        suggestion: match[0].charAt(0) + match[0].slice(1).toLowerCase(),
        reason: 'Avoid all caps as it can seem like shouting',
        position: match.index,
        context: getContext(text, match.index, 20),
      })
    }
  }

  return suggestions.sort((a, b) => a.position - b.position)
}

// Get context around a position
function getContext(text: string, position: number, length: number): string {
  const start = Math.max(0, position - length)
  const end = Math.min(text.length, position + length)
  return text.substring(start, end)
}

// Apply suggestions to text
export function applySuggestions(text: string, suggestions: WordSuggestion[]): string {
  let result = text
  // Apply in reverse order to maintain positions
  const sorted = [...suggestions].sort((a, b) => b.position - a.position)
  
  sorted.forEach((suggestion) => {
    if (suggestion.suggestion) {
      const before = result.substring(0, suggestion.position)
      const after = result.substring(suggestion.position + suggestion.original.length)
      result = before + suggestion.suggestion + after
    } else {
      // Remove the word entirely
      const before = result.substring(0, suggestion.position)
      const after = result.substring(suggestion.position + suggestion.original.length)
      result = before + after
    }
  })
  
  return result
}

// Get suggestions formatted for display
export function formatSuggestions(suggestions: WordSuggestion[]): string[] {
  return suggestions.map((s) => {
    if (s.suggestion) {
      return `"${s.original}" → "${s.suggestion}" - ${s.reason}`
    } else {
      return `Remove "${s.original}" - ${s.reason}`
    }
  })
}


