// Enhanced key points detection with synonyms and semantic analysis

interface KeyPointMatch {
  keyPoint: string
  matched: boolean
  confidence: number
  matchedKeywords: string[]
}

// Common synonyms and related terms
const synonymMap: Record<string, string[]> = {
  'acknowledge': ['recognize', 'understand', 'appreciate', 'note', 'realize'],
  'concern': ['worry', 'issue', 'problem', 'matter', 'situation'],
  'apologize': ['sorry', 'apology', 'regret', 'apologetic'],
  'solution': ['resolve', 'fix', 'address', 'handle', 'remedy', 'answer'],
  'update': ['status', 'progress', 'information', 'news', 'report'],
  'clear': ['transparent', 'direct', 'straightforward', 'explicit', 'obvious'],
  'thorough': ['complete', 'comprehensive', 'detailed', 'extensive', 'full'],
  'context': ['background', 'situation', 'circumstances', 'details'],
  'questions': ['inquiries', 'concerns', 'queries', 'issues'],
  'transparency': ['openness', 'honesty', 'clarity', 'directness'],
  'enthusiasm': ['excited', 'thrilled', 'eager', 'passionate'],
  'gratitude': ['thank', 'appreciate', 'grateful', 'thanks'],
  'support': ['help', 'assist', 'aid', 'guidance'],
  'expectations': ['goals', 'objectives', 'outcomes', 'results'],
  'polite': ['courteous', 'respectful', 'considerate', 'professional'],
  'understanding': ['comprehend', 'grasp', 'recognize', 'acknowledge'],
  'purpose': ['goal', 'objective', 'aim', 'intention'],
  'flexible': ['adaptable', 'accommodating', 'open', 'willing'],
  'brief': ['concise', 'short', 'succinct', 'to the point'],
  'professional': ['businesslike', 'formal', 'appropriate', 'suitable'],
}

// Check if key point is addressed using enhanced matching
export function checkKeyPointAddressed(
  keyPoint: string,
  response: string
): { matched: boolean; confidence: number; matchedKeywords: string[] } {
  const responseLower = response.toLowerCase()
  const keyPointLower = keyPoint.toLowerCase()
  
  // Extract keywords from key point (first 2-3 important words)
  const keyPointWords = keyPointLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3)
  
  const matchedKeywords: string[] = []
  let matchCount = 0
  let totalChecks = 0
  
  // Check direct matches
  for (const word of keyPointWords) {
    totalChecks++
    if (responseLower.includes(word)) {
      matchCount++
      matchedKeywords.push(word)
    }
  }
  
  // Check synonyms
  for (const word of keyPointWords) {
    if (synonymMap[word]) {
      for (const synonym of synonymMap[word]) {
        totalChecks++
        if (responseLower.includes(synonym)) {
          matchCount++
          matchedKeywords.push(synonym)
        }
      }
    }
  }
  
  // Check for related concepts (semantic matching)
  const conceptPatterns: Record<string, RegExp[]> = {
    'acknowledge': [
      /\b(i understand|i recognize|i appreciate|i realize|i see|i know)\b/i,
      /\b(acknowledge|recognize|understand|appreciate)\b/i,
    ],
    'apologize': [
      /\b(i apologize|i'm sorry|i regret|apologize|sorry)\b/i,
      /\b(apology|apologetic)\b/i,
    ],
    'solution': [
      /\b(solution|resolve|fix|address|handle|remedy|propose|offer|suggest)\b/i,
      /\b(we can|i can|we will|i will)\b/i,
    ],
    'update': [
      /\b(status|update|progress|information|current|latest)\b/i,
      /\b(here is|i wanted to|let me provide)\b/i,
    ],
    'questions': [
      /\b(questions|inquiries|concerns|queries|if you have|please let me know)\b/i,
      /\b(available|happy to|willing to|glad to)\b.*\b(answer|discuss|help)\b/i,
    ],
    'enthusiasm': [
      /\b(excited|thrilled|delighted|pleased|happy|great)\b/i,
      /\b(looking forward|eager|enthusiastic)\b/i,
    ],
    'gratitude': [
      /\b(thank|thanks|appreciate|grateful|appreciation)\b/i,
    ],
    'support': [
      /\b(support|help|assist|aid|guidance|here for|available)\b/i,
      /\b(team|we|i).*\b(here|available|ready)\b/i,
    ],
  }
  
  // Check concept patterns
  for (const word of keyPointWords) {
    if (conceptPatterns[word]) {
      for (const pattern of conceptPatterns[word]) {
        totalChecks++
        if (pattern.test(response)) {
          matchCount++
          matchedKeywords.push(word)
        }
      }
    }
  }
  
  // Calculate confidence (0-1)
  const confidence = totalChecks > 0 ? matchCount / totalChecks : 0
  
  // Consider it matched if confidence is above threshold
  const matched = confidence >= 0.3 || matchCount >= 1
  
  return {
    matched,
    confidence: Math.min(1, confidence),
    matchedKeywords: [...new Set(matchedKeywords)],
  }
}

// Check all key points and return detailed results
export function checkAllKeyPoints(
  keyPoints: string[],
  response: string
): KeyPointMatch[] {
  return keyPoints.map((keyPoint) => {
    const result = checkKeyPointAddressed(keyPoint, response)
    return {
      keyPoint,
      matched: result.matched,
      confidence: result.confidence,
      matchedKeywords: result.matchedKeywords,
    }
  })
}

// Calculate appropriateness score based on key points
export function calculateAppropriatenessScore(
  keyPoints: string[],
  response: string
): number {
  const matches = checkAllKeyPoints(keyPoints, response)
  const matchedCount = matches.filter(m => m.matched).length
  const totalConfidence = matches.reduce((sum, m) => sum + m.confidence, 0)
  
  // Weight: 70% based on matched count, 30% based on confidence
  const countScore = (matchedCount / keyPoints.length) * 0.7
  const confidenceScore = (totalConfidence / keyPoints.length) * 0.3
  
  return (countScore + confidenceScore) * 100
}


