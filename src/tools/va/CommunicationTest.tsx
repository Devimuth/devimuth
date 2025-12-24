import { useState, useEffect, useRef } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Send, RotateCcw, AlertCircle, CheckCircle2, FileText, TrendingUp, MessageSquare, Eye, ChevronDown, ChevronUp, Download, BarChart3, BookOpen, ToggleLeft, ToggleRight, Wand2, Check } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'
import { downloadFile } from '../../utils/dev/fileHandler'
import { getScenarios, getScenarioById, type CommunicationScenario } from '../../utils/va/communicationScenarios'
import { analyzeTone, checkGrammarAndSpelling, type GrammarError, type ToneAnalysis } from '../../utils/va/grammarChecker'
import { saveCommunicationTestResult, loadCommunicationTestHistory, type CommunicationTestResult } from '../../utils/va/storage'
import { calculateAppropriatenessScore, checkAllKeyPoints } from '../../utils/va/keyPointsMatcher'
import { calculateReadability, interpretFleschReadingEase, getReadabilityRecommendations } from '../../utils/va/readabilityUtils'
import { getWordSuggestions } from '../../utils/va/wordSuggestions'
import { validateEmailStructure, generateSubjectSuggestions, generateGreetingSuggestions, generateClosingSuggestions } from '../../utils/va/emailTemplates'

interface TestScore {
  tone: number
  grammar: number
  clarity: number
  appropriateness: number
  total: number
}

export default function CommunicationTest() {
  const [scenarios, setScenarios] = useState<CommunicationScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<CommunicationScenario | null>(null)
  const [userResponse, setUserResponse] = useState('')
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [toneAnalysis, setToneAnalysis] = useState<ToneAnalysis | null>(null)
  const [score, setScore] = useState<TestScore | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory] = useState<CommunicationTestResult[]>([])
  const [showExample, setShowExample] = useState(false)
  const [keyPointMatches, setKeyPointMatches] = useState<Array<{ keyPoint: string; matched: boolean; confidence: number }>>([])
  const [realtimeTone, setRealtimeTone] = useState<ToneAnalysis | null>(null)
  const [realtimeGrammarErrors, setRealtimeGrammarErrors] = useState<GrammarError[]>([])
  const [realtimeKeyPoints, setRealtimeKeyPoints] = useState<Array<{ keyPoint: string; matched: boolean; confidence: number }>>([])
  const [readabilityMetrics, setReadabilityMetrics] = useState<ReturnType<typeof calculateReadability> | null>(null)
  const [wordSuggestions, setWordSuggestions] = useState<ReturnType<typeof getWordSuggestions>>([])
  const [practiceMode, setPracticeMode] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setScenarios(getScenarios())
    // Load first scenario by default
    const firstScenario = getScenarios()[0]
    if (firstScenario) {
      setSelectedScenario(firstScenario)
    }
    setHistory(loadCommunicationTestHistory())
  }, [])

  // Real-time analysis (debounced)
  useEffect(() => {
    if (!selectedScenario || submitted || !userResponse.trim()) {
      setRealtimeTone(null)
      setRealtimeGrammarErrors([])
      setRealtimeKeyPoints([])
      return
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce analysis (500ms)
    debounceTimerRef.current = setTimeout(() => {
      const errors = checkGrammarAndSpelling(userResponse)
      const tone = analyzeTone(userResponse)
      const matches = checkAllKeyPoints(selectedScenario.keyPoints, userResponse)
      
      setRealtimeGrammarErrors(errors)
      setRealtimeTone(tone)
      setRealtimeKeyPoints(matches.map(m => ({ keyPoint: m.keyPoint, matched: m.matched, confidence: m.confidence })))
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [userResponse, selectedScenario, submitted])

  function handleScenarioChange(scenarioId: string) {
    const scenario = getScenarioById(scenarioId)
    if (scenario) {
      setSelectedScenario(scenario)
      setUserResponse('')
      setGrammarErrors([])
      setToneAnalysis(null)
      setScore(null)
      setSubmitted(false)
      setShowExample(false)
      setKeyPointMatches([])
      setRealtimeTone(null)
      setRealtimeGrammarErrors([])
      setRealtimeKeyPoints([])
    }
  }

  function analyzeResponse() {
    if (!userResponse.trim()) {
      toast.error('Please write a response first')
      return
    }

    if (!selectedScenario) {
      toast.error('Please select a scenario')
      return
    }

    // Check grammar and spelling
    const errors = checkGrammarAndSpelling(userResponse)
    setGrammarErrors(errors)

    // Analyze tone
    const tone = analyzeTone(userResponse)
    setToneAnalysis(tone)

    // Calculate scores
    const scores = calculateScore(userResponse, errors, tone, selectedScenario)
    setScore(scores)
    
    // Calculate key point matches for display
    const matches = checkAllKeyPoints(selectedScenario.keyPoints, userResponse)
    setKeyPointMatches(matches.map(m => ({ keyPoint: m.keyPoint, matched: m.matched, confidence: m.confidence })))
    
    // Calculate readability metrics
    const readability = calculateReadability(userResponse)
    setReadabilityMetrics(readability)
    
    // Get word suggestions
    const suggestions = getWordSuggestions(userResponse)
    setWordSuggestions(suggestions)
    
    setSubmitted(true)

    // Save to history only if not in practice mode
    if (!practiceMode) {
      const result: CommunicationTestResult = {
        id: `test-${Date.now()}`,
        date: new Date().toISOString(),
        scenarioId: selectedScenario.id,
        scenarioTitle: selectedScenario.title,
        score: scores.total,
        toneScore: scores.tone,
        grammarScore: scores.grammar,
        clarityScore: scores.clarity,
        appropriatenessScore: scores.appropriateness,
      }
      saveCommunicationTestResult(result)
      setHistory(loadCommunicationTestHistory())
      toast.success('Response analyzed!')
    } else {
      toast.success('Response analyzed! (Practice Mode - not saved to history)')
    }
  }

  function calculateScore(
    response: string,
    errors: GrammarError[],
    tone: ToneAnalysis,
    scenario: CommunicationScenario
  ): TestScore {
    // Professional tone score (30%)
    let toneScore = 0
    if (tone.tone === scenario.expectedTone) {
      toneScore = 30
    } else if (
      (scenario.expectedTone === 'professional' && (tone.tone === 'formal' || tone.tone === 'friendly')) ||
      (scenario.expectedTone === 'friendly' && (tone.tone === 'professional' || tone.tone === 'casual'))
    ) {
      toneScore = 20
    } else {
      toneScore = 10
    }

    // Grammar and spelling score (30%)
    const errorRate = errors.length / Math.max(response.split(/\s+/).length, 1)
    const grammarScore = Math.max(0, 30 - errorRate * 30)
    const finalGrammarScore = Math.min(30, grammarScore)

    // Clarity and completeness score (25%)
    const wordCount = response.split(/\s+/).length
    const hasCompleteThoughts = response.split(/[.!?]/).filter((s) => s.trim().length > 10).length >= 2
    const clarityScore = hasCompleteThoughts ? Math.min(25, wordCount * 0.5) : Math.min(15, wordCount * 0.3)

    // Appropriate response score (15%)
    // Use enhanced key points detection with synonyms and semantic analysis
    const appropriatenessScore = (calculateAppropriatenessScore(scenario.keyPoints, response) / 100) * 15

    const total = toneScore + finalGrammarScore + clarityScore + appropriatenessScore

    return {
      tone: Math.round(toneScore * 100) / 100,
      grammar: Math.round(finalGrammarScore * 100) / 100,
      clarity: Math.round(clarityScore * 100) / 100,
      appropriateness: Math.round(appropriatenessScore * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }

  function resetTest() {
    setUserResponse('')
    setGrammarErrors([])
    setToneAnalysis(null)
    setScore(null)
    setSubmitted(false)
    setShowExample(false)
    setKeyPointMatches([])
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  function getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
  }

  // Helper to get chart tooltip styles based on dark mode
  function getTooltipStyles() {
    const isDark = document.documentElement.classList.contains('dark')
    return {
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
      borderRadius: '8px',
      color: isDark ? '#f3f4f6' : '#111827',
    }
  }

  function exportResults(format: 'json' | 'csv') {
    if (!submitted || !score || !selectedScenario || !userResponse) {
      toast.error('No results to export')
      return
    }

    const exportData = {
      date: new Date().toISOString(),
      scenario: {
        id: selectedScenario.id,
        title: selectedScenario.title,
        description: selectedScenario.description,
      },
      scores: {
        total: score.total,
        tone: score.tone,
        grammar: score.grammar,
        clarity: score.clarity,
        appropriateness: score.appropriateness,
      },
      response: userResponse,
      analysis: {
        tone: toneAnalysis,
        grammarErrors: grammarErrors,
        grammarErrorCount: grammarErrors.length,
      },
    }

    if (format === 'json') {
      const json = JSON.stringify(exportData, null, 2)
      downloadFile(json, `communication-test-${selectedScenario.title.replace(/\s+/g, '-')}-${Date.now()}.json`, 'application/json')
      toast.success('Results exported as JSON!')
    } else {
      // CSV format
      const headers = ['Date', 'Scenario', 'Total Score', 'Tone Score', 'Grammar Score', 'Clarity Score', 'Appropriateness Score', 'Grammar Errors', 'Detected Tone', 'Response Length']
      const row = [
        new Date().toLocaleString(),
        selectedScenario.title,
        score.total.toFixed(1),
        score.tone.toFixed(1),
        score.grammar.toFixed(1),
        score.clarity.toFixed(1),
        score.appropriateness.toFixed(1),
        grammarErrors.length.toString(),
        toneAnalysis?.tone || 'N/A',
        userResponse.length.toString(),
      ]
      const csv = [headers.join(','), row.map((cell) => `"${cell}"`).join(',')].join('\n')
      downloadFile(csv, `communication-test-${selectedScenario.title.replace(/\s+/g, '-')}-${Date.now()}.csv`, 'text/csv')
      toast.success('Results exported as CSV!')
    }
  }

  return (
    <ToolPage
      title="Communication Test"
      description="Test your professional communication skills by responding to email scenarios. Get instant feedback on grammar, tone, clarity, and appropriateness."
      keywords="communication test, email writing, professional writing, grammar check, tone analysis, business communication"
    >
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Practice Mode</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {practiceMode ? 'No scoring, unlimited retries, immediate feedback' : 'Scored tests saved to history'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setPracticeMode(!practiceMode)
              if (submitted) {
                resetTest()
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            disabled={submitted && !practiceMode}
          >
            {practiceMode ? (
              <>
                <ToggleRight className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">On</span>
              </>
            ) : (
              <>
                <ToggleLeft className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Off</span>
              </>
            )}
          </button>
        </div>

        {/* Scenario Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Scenario
          </label>
          <select
            value={selectedScenario?.id || ''}
            onChange={(e) => handleScenarioChange(e.target.value)}
            disabled={submitted && !practiceMode}
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Choose a scenario...</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Scenario Display */}
        {selectedScenario && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedScenario.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedScenario.description}</p>
              </div>
            </div>
            
            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Context
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedScenario.context}</p>
            </div>

            <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Email to Respond To
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-700/50 rounded p-3 border border-gray-200 dark:border-gray-600">
                {selectedScenario.emailContent}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Expected Tone</h4>
                <span className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                  {selectedScenario.expectedTone.charAt(0).toUpperCase() + selectedScenario.expectedTone.slice(1)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Key Points</h4>
                <ul className="space-y-1.5">
                  {selectedScenario.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Response Input */}
        {selectedScenario && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Your Response
              </label>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Wand2 className="h-4 w-4" />
                <span>Email Templates</span>
              </button>
            </div>
            
            {/* Email Templates Helper */}
            {showTemplates && selectedScenario && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Email Structure Helper</h4>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
                
                {/* Structure Validation */}
                {(() => {
                  const validation = validateEmailStructure(userResponse)
                  return (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Structure Check:</span>
                        {validation.isValid ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3 w-3" />
                            Complete
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400">Needs improvement</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className={`p-2 rounded ${validation.hasSubject ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {validation.hasSubject ? '✓' : '○'} Subject
                        </div>
                        <div className={`p-2 rounded ${validation.hasGreeting ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {validation.hasGreeting ? '✓' : '○'} Greeting
                        </div>
                        <div className={`p-2 rounded ${validation.hasBody ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {validation.hasBody ? '✓' : '○'} Body
                        </div>
                        <div className={`p-2 rounded ${validation.hasClosing ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {validation.hasClosing ? '✓' : '○'} Closing
                        </div>
                        <div className={`p-2 rounded ${validation.hasSignature ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                          {validation.hasSignature ? '✓' : '○'} Signature
                        </div>
                      </div>
                      {validation.suggestions.length > 0 && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <div className="font-medium mb-1">Suggestions:</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {validation.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })()}
                
                {/* Template Suggestions */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Line:</div>
                    <div className="flex flex-wrap gap-2">
                      {generateSubjectSuggestions(selectedScenario.title, selectedScenario.expectedTone).slice(0, 3).map((subject, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            const lines = userResponse.split('\n')
                            if (lines[0]?.toLowerCase().startsWith('subject:')) {
                              setUserResponse('Subject: ' + subject.replace(/^Re:\s*/, '') + '\n' + lines.slice(1).join('\n'))
                            } else {
                              setUserResponse('Subject: ' + subject.replace(/^Re:\s*/, '') + '\n\n' + userResponse)
                            }
                          }}
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Greeting:</div>
                    <div className="flex flex-wrap gap-2">
                      {generateGreetingSuggestions(selectedScenario.expectedTone).slice(0, 3).map((greeting, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (!userResponse.toLowerCase().includes('dear') && !userResponse.toLowerCase().includes('hello') && !userResponse.toLowerCase().includes('hi')) {
                              setUserResponse(greeting + '\n\n' + userResponse)
                            }
                          }}
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          {greeting}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Closing:</div>
                    <div className="flex flex-wrap gap-2">
                      {generateClosingSuggestions(selectedScenario.expectedTone).slice(0, 3).map((closing, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (!userResponse.toLowerCase().includes('regards') && !userResponse.toLowerCase().includes('sincerely') && !userResponse.toLowerCase().includes('best')) {
                              setUserResponse(userResponse + '\n\n' + closing + '\n[Your Name]')
                            }
                          }}
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          {closing}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="!m-1">
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                disabled={submitted}
                placeholder="Write your response here... Remember to address all key points and match the expected tone."
                className="w-full h-64 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 transition-all resize-none"
              />
            </div>
            
            {/* Real-time Feedback Indicators */}
            {!submitted && userResponse.trim().length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Word Count */}
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Words</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {userResponse.split(/\s+/).filter((w) => w.length > 0).length}
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        / {selectedScenario.keyPoints.length * 20}+
                      </span>
                    </div>
                  </div>
                  
                  {/* Tone Indicator */}
                  {realtimeTone && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tone</div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          realtimeTone.tone === selectedScenario.expectedTone
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : realtimeTone.tone === 'mixed' || 
                              (selectedScenario.expectedTone === 'professional' && (realtimeTone.tone === 'formal' || realtimeTone.tone === 'friendly'))
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {realtimeTone.tone.charAt(0).toUpperCase() + realtimeTone.tone.slice(1)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Grammar Errors */}
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Grammar</div>
                    <div className={`text-lg font-semibold ${
                      realtimeGrammarErrors.length === 0
                        ? 'text-green-600 dark:text-green-400'
                        : realtimeGrammarErrors.length <= 2
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {realtimeGrammarErrors.length} {realtimeGrammarErrors.length === 1 ? 'error' : 'errors'}
                    </div>
                  </div>
                  
                  {/* Key Points Progress */}
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Key Points</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            realtimeKeyPoints.filter(kp => kp.matched).length === selectedScenario.keyPoints.length
                              ? 'bg-green-600 dark:bg-green-400'
                              : realtimeKeyPoints.filter(kp => kp.matched).length >= selectedScenario.keyPoints.length * 0.5
                              ? 'bg-yellow-600 dark:bg-yellow-400'
                              : 'bg-red-600 dark:bg-red-400'
                          }`}
                          style={{
                            width: `${(realtimeKeyPoints.filter(kp => kp.matched).length / selectedScenario.keyPoints.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {realtimeKeyPoints.filter(kp => kp.matched).length}/{selectedScenario.keyPoints.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium">{userResponse.split(/\s+/).filter((w) => w.length > 0).length}</span> words
                {userResponse.length > 0 && (
                  <span className="ml-3">
                    <span className="font-medium">{userResponse.length}</span> characters
                  </span>
                )}
              </p>
              {userResponse.trim().length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Start writing your response...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {selectedScenario && (
          <div className="flex items-center gap-3">
            {!submitted ? (
              <button
                onClick={analyzeResponse}
                disabled={!userResponse.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg"
              >
                <Send className="h-5 w-5" />
                <span>Analyze Response</span>
              </button>
            ) : (
              <button
                onClick={resetTest}
                className="flex items-center gap-2 px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Try Again</span>
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {submitted && score && (
          <div className="space-y-6">
            {/* Practice Mode Notice */}
            {practiceMode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">Practice Mode Active</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      This test is not saved to your history. You can view the example response immediately below.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Score */}
            {!practiceMode && (
              <div className={`${getScoreBgColor(score.total)} border rounded-lg p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {score.total >= 80 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Overall Score</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-4xl font-bold ${getScoreColor(score.total)}`}>
                      {score.total.toFixed(1)}/100
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportResults('json')}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        title="Export as JSON"
                      >
                        <Download className="h-4 w-4" />
                        <span>JSON</span>
                      </button>
                      <button
                        onClick={() => exportResults('csv')}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="Export as CSV"
                      >
                        <Download className="h-4 w-4" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tone (30%)</div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.tone)}`}>
                      {score.tone.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grammar (30%)</div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.grammar)}`}>
                      {score.grammar.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Clarity (25%)</div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.clarity)}`}>
                      {score.clarity.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Appropriateness (15%)</div>
                    <div className={`text-2xl font-bold ${getScoreColor(score.appropriateness)}`}>
                      {score.appropriateness.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Practice Mode Score Display */}
            {practiceMode && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Practice Mode - Feedback Only</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In practice mode, you receive feedback without scoring. Review the analysis below and try again to improve!
                </p>
              </div>
            )}

            {/* Tone Analysis */}
            {toneAnalysis && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tone Analysis</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Detected Tone: </span>
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                      {toneAnalysis.tone.charAt(0).toUpperCase() + toneAnalysis.tone.slice(1)}
                    </span>
                    {selectedScenario && toneAnalysis.tone !== selectedScenario.expectedTone && (
                      <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                        (Expected: {selectedScenario.expectedTone.charAt(0).toUpperCase() + selectedScenario.expectedTone.slice(1)})
                      </span>
                    )}
                  </div>
                  {toneAnalysis.keywords.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Keywords detected: </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {toneAnalysis.keywords?.join(', ') || 'None'}
                      </span>
                    </div>
                  )}
                  {toneAnalysis.suggestions && toneAnalysis.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggestions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {toneAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grammar Errors */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grammar & Spelling</h3>
                <span className={`ml-auto px-4 py-1.5 rounded-full text-sm font-medium ${
                  grammarErrors.length === 0
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                }`}>
                  {grammarErrors.length} issue{grammarErrors.length !== 1 ? 's' : ''} found
                </span>
              </div>
              
              {/* Word Suggestions */}
              {wordSuggestions.length > 0 && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Word Choice Suggestions ({wordSuggestions.length})
                  </h4>
                  <div className="space-y-2">
                    {wordSuggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">"{suggestion.original}"</span>
                        {suggestion.suggestion && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400 mx-2">→</span>
                            <span className="font-medium text-purple-700 dark:text-purple-300">"{suggestion.suggestion}"</span>
                          </>
                        )}
                        <span className="text-gray-600 dark:text-gray-400 ml-2">- {suggestion.reason}</span>
                      </div>
                    ))}
                    {wordSuggestions.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        ... and {wordSuggestions.length - 5} more suggestion{wordSuggestions.length - 5 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {grammarErrors.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400">
                    No grammar or spelling errors found!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Great job on your writing!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grammarErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 text-xs font-medium bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full">
                          {error.type}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{error.message}</span>
                      </div>
                      {error.suggestion && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 pl-1 border-l-2 border-amber-300 dark:border-amber-700">
                          <span className="font-medium">Suggestion:</span> {error.suggestion}
                        </p>
                      )}
                    </div>
                  ))}
                  {grammarErrors.length > 10 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ... and <span className="font-medium">{grammarErrors.length - 10}</span> more issue{grammarErrors.length - 10 !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback</h3>
              </div>
              <div className="space-y-2">
                {score.total >= 80 ? (
                  <p className="text-green-600 dark:text-green-400">
                    Excellent work! Your response demonstrates strong communication skills with appropriate tone,
                    good grammar, and clear messaging.
                  </p>
                ) : score.total >= 60 ? (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Good effort! Your response is on the right track, but there's room for improvement in some areas.
                    Review the feedback above and try to address the key points more comprehensively.
                  </p>
                ) : (
                  <p className="text-red-600 dark:text-red-400">
                    There's significant room for improvement. Focus on matching the expected tone, improving grammar
                    and spelling, and ensuring your response addresses all key points clearly.
                  </p>
                )}
                {selectedScenario && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Key Points Addressed:
                    </h4>
                    <ul className="space-y-2">
                      {keyPointMatches.length > 0 ? (
                        keyPointMatches.map((match, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            {match.matched ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">{match.keyPoint}</span>
                                  {match.confidence < 0.7 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      (partially addressed)
                                    </span>
                                  )}
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-500 dark:text-gray-400">
                                  {match.keyPoint}
                                </span>
                              </>
                            )}
                          </li>
                        ))
                      ) : (
                        selectedScenario.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-primary-500 mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Readability Metrics */}
            {readabilityMetrics && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Readability Analysis</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Flesch Reading Ease</div>
                    <div className={`text-2xl font-bold ${
                      readabilityMetrics.fleschReadingEase >= 70
                        ? 'text-green-600 dark:text-green-400'
                        : readabilityMetrics.fleschReadingEase >= 50
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {readabilityMetrics.fleschReadingEase.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {interpretFleschReadingEase(readabilityMetrics.fleschReadingEase).level}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grade Level</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {readabilityMetrics.fleschKincaidGrade.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {readabilityMetrics.fleschKincaidGrade < 10 ? 'Good' : readabilityMetrics.fleschKincaidGrade < 13 ? 'Moderate' : 'High'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Sentence Length</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {readabilityMetrics.averageWordsPerSentence.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">words</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Words</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {readabilityMetrics.totalWords}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {readabilityMetrics.totalSentences} sentences
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {interpretFleschReadingEase(readabilityMetrics.fleschReadingEase).description}
                  </div>
                  {getReadabilityRecommendations(readabilityMetrics).length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recommendations:</div>
                      <ul className="space-y-1">
                        {getReadabilityRecommendations(readabilityMetrics).map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Example Response */}
            {selectedScenario && selectedScenario.exampleResponse && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                <button
                  onClick={() => setShowExample(!showExample)}
                  className="w-full flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Example Response</h3>
                    {practiceMode && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        Available in Practice Mode
                      </span>
                    )}
                  </div>
                  {showExample ? (
                    <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                
                {(showExample || practiceMode) && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                        {selectedScenario.exampleResponse}
                      </div>
                    </div>
                    
                    {selectedScenario.exampleResponseNotes && selectedScenario.exampleResponseNotes.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Key Strengths of This Response:
                        </h4>
                        <ul className="space-y-2">
                          {selectedScenario.exampleResponseNotes.map((note, index) => (
                            <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress Dashboard */}
        {history.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress Dashboard</h3>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tests</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{history.length}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(history.reduce((sum, h) => sum + h.score, 0) / history.length)}`}>
                  {(history.reduce((sum, h) => sum + h.score, 0) / history.length).toFixed(1)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(Math.max(...history.map(h => h.score)))}`}>
                  {Math.max(...history.map(h => h.score)).toFixed(1)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Improvement</div>
                <div className={`text-2xl font-bold ${
                  history.length >= 2 && history[0].score > history[history.length - 1].score
                    ? 'text-green-600 dark:text-green-400'
                    : history.length >= 2 && history[0].score < history[history.length - 1].score
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {history.length >= 2
                    ? `${(history[0].score - history[history.length - 1].score).toFixed(1)}`
                    : 'N/A'}
                </div>
              </div>
            </div>

            {/* Score Trends Chart */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Score Trends</h4>
              </div>
              {history.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history.slice().reverse().map((h, index) => ({
                    test: history.length - index,
                    score: h.score,
                    tone: h.toneScore,
                    grammar: h.grammarScore,
                    clarity: h.clarityScore,
                  }))}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} 
                    />
                    <XAxis 
                      dataKey="test" 
                      label={{ 
                        value: 'Test Number', 
                        position: 'insideBottom', 
                        offset: -5,
                        style: { fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }
                      }}
                      stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'}
                      tick={{ fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Score', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }
                      }}
                      stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'}
                      tick={{ fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={getTooltipStyles()}
                      labelStyle={{ color: getTooltipStyles().color }}
                      itemStyle={{ color: getTooltipStyles().color }}
                    />
                    <Legend 
                      wrapperStyle={{ color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Total Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tone" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', r: 3 }}
                      name="Tone"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="grammar" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b', r: 3 }}
                      name="Grammar"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clarity" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }}
                      name="Clarity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Performance by Scenario */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Performance by Scenario</h4>
              {(() => {
                const scenarioStats = history.reduce((acc, result) => {
                  if (!acc[result.scenarioTitle]) {
                    acc[result.scenarioTitle] = { count: 0, totalScore: 0, scores: [] }
                  }
                  acc[result.scenarioTitle].count++
                  acc[result.scenarioTitle].totalScore += result.score
                  acc[result.scenarioTitle].scores.push(result.score)
                  return acc
                }, {} as Record<string, { count: number; totalScore: number; scores: number[] }>)

                const scenarioData = Object.entries(scenarioStats).map(([title, stats]) => ({
                  scenario: title,
                  average: stats.totalScore / stats.count,
                  count: stats.count,
                  best: Math.max(...stats.scores),
                })).sort((a, b) => b.average - a.average)

                return scenarioData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scenarioData}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} 
                    />
                    <XAxis 
                      dataKey="scenario" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'}
                      tick={{ fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Average Score', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }
                      }}
                      stroke={document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280'}
                      tick={{ fill: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' }}
                      domain={[0, 100]}
                    />
                      <Tooltip 
                        contentStyle={getTooltipStyles()}
                        labelStyle={{ color: getTooltipStyles().color }}
                        itemStyle={{ color: getTooltipStyles().color }}
                        formatter={(value: any) => [`${value.toFixed(1)}`, 'Average Score']}
                      />
                      <Bar dataKey="average" fill="#3b82f6" name="Average Score" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null
              })()}
            </div>

            {/* Weak Areas Identification */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Areas for Improvement</h4>
              {(() => {
                const avgTone = history.reduce((sum, h) => sum + h.toneScore, 0) / history.length
                const avgGrammar = history.reduce((sum, h) => sum + h.grammarScore, 0) / history.length
                const avgClarity = history.reduce((sum, h) => sum + h.clarityScore, 0) / history.length
                const avgAppropriateness = history.reduce((sum, h) => sum + (h.appropriatenessScore || 0), 0) / history.length

                const areas = [
                  { name: 'Tone', score: avgTone, max: 30 },
                  { name: 'Grammar', score: avgGrammar, max: 30 },
                  { name: 'Clarity', score: avgClarity, max: 25 },
                  { name: 'Appropriateness', score: avgAppropriateness, max: 15 },
                ].sort((a, b) => a.score - b.score)

                return (
                  <div className="space-y-3">
                    {areas.map((area) => (
                      <div key={area.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{area.name}</span>
                          <span className={`text-sm font-semibold ${getScoreColor((area.score / area.max) * 100)}`}>
                            {area.score.toFixed(1)}/{area.max}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              (area.score / area.max) * 100 >= 80
                                ? 'bg-green-600 dark:bg-green-400'
                                : (area.score / area.max) * 100 >= 60
                                ? 'bg-yellow-600 dark:text-yellow-400'
                                : 'bg-red-600 dark:bg-red-400'
                            }`}
                            style={{ width: `${(area.score / area.max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* History Table */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Tests</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Scenario</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Score</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Tone</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Grammar</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Clarity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((result) => (
                      <tr key={result.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{result.scenarioTitle}</td>
                        <td className={`py-2 px-3 text-right font-medium ${getScoreColor(result.score)}`}>
                          {result.score.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                          {result.toneScore.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                          {result.grammarScore.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                          {result.clarityScore.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

