// LocalStorage utilities for productivity tools

const STORAGE_KEYS = {
  TYPING_TEST_HISTORY: 'devimuth_va_typing_test_history',
  ASSESSMENTS: 'devimuth_va_assessments',
  COMMUNICATION_TEST_HISTORY: 'devimuth_va_communication_test_history',
} as const

// Typing Test Storage
export interface CharacterBreakdown {
  correct: number
  incorrect: number
  missed: number
  extra: number
}

export interface TypingTestResult {
  id: string
  date: string
  duration: number // in seconds
  wpm: number
  accuracy: number
  charactersTyped: number
  errors: number
  consistency?: number // WPM standard deviation
  characterBreakdown?: CharacterBreakdown
  textSampleId?: string
  textSampleTitle?: string
  testMode?: 'time' | 'words'
  textSource?: 'random' | 'quote' | 'custom'
  wpmHistory?: Array<{ wpm: number; errors: number }> // WPM and errors at each time interval for graph
}

export function saveTypingHistory(result: TypingTestResult): void {
  try {
    const existing = loadTypingHistory()
    const updated = [result, ...existing].slice(0, 100) // Keep last 100 results
    localStorage.setItem(STORAGE_KEYS.TYPING_TEST_HISTORY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save typing history:', error)
  }
}

export function loadTypingHistory(): TypingTestResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TYPING_TEST_HISTORY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load typing history:', error)
    return []
  }
}

export function clearTypingHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TYPING_TEST_HISTORY)
  } catch (error) {
    console.error('Failed to clear typing history:', error)
  }
}

// Assessment Storage
export interface SavedAssessment {
  id: string
  title: string
  description: string
  questions: any[] // Will use Assessment interface from assessmentTemplates
  createdAt: string
  updatedAt: string
}

export function saveAssessment(assessment: SavedAssessment): void {
  try {
    const existing = loadAssessments()
    const index = existing.findIndex((a) => a.id === assessment.id)
    const updated = index >= 0 
      ? existing.map((a, i) => i === index ? { ...assessment, updatedAt: new Date().toISOString() } : a)
      : [...existing, { ...assessment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }]
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save assessment:', error)
  }
}

export function loadAssessments(): SavedAssessment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load assessments:', error)
    return []
  }
}

export function loadAssessment(id: string): SavedAssessment | null {
  const assessments = loadAssessments()
  return assessments.find((a) => a.id === id) || null
}

export function deleteAssessment(id: string): void {
  try {
    const existing = loadAssessments()
    const updated = existing.filter((a) => a.id !== id)
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to delete assessment:', error)
  }
}

// Communication Test Storage
export interface CommunicationTestResult {
  id: string
  date: string
  scenarioId: string
  scenarioTitle: string
  score: number
  toneScore: number
  grammarScore: number
  clarityScore: number
  appropriatenessScore: number
}

export function saveCommunicationTestResult(result: CommunicationTestResult): void {
  try {
    const existing = loadCommunicationTestHistory()
    const updated = [result, ...existing].slice(0, 50) // Keep last 50 results
    localStorage.setItem(STORAGE_KEYS.COMMUNICATION_TEST_HISTORY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save communication test result:', error)
  }
}

export function loadCommunicationTestHistory(): CommunicationTestResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.COMMUNICATION_TEST_HISTORY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to load communication test history:', error)
    return []
  }
}


