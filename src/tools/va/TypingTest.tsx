import { useState, useEffect, useRef } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { RotateCcw, Download, Trash2, Clock, Hash, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { downloadFile } from '../../utils/dev/fileHandler'
import { generateRandomWords, getRandomQuote, type RandomWordOptions, type QuoteLength } from '../../utils/va/textSamples'
import { saveTypingHistory, loadTypingHistory, clearTypingHistory, type TypingTestResult, type CharacterBreakdown } from '../../utils/va/storage'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Textarea from '../../components/Textarea'

type TestMode = 'time' | 'words'
type TextSource = 'random' | 'quote' | 'custom'

type CharacterStatus = 'pending' | 'current' | 'correct' | 'incorrect'

interface CharacterData {
  char: string
  status: CharacterStatus
}

interface WPMDataPoint {
  time: number
  wpm: number
  incorrect: number
}

export default function TypingTest() {
  // Test configuration
  const [testMode, setTestMode] = useState<TestMode>('time')
  const [duration, setDuration] = useState<number>(60) // seconds for time mode
  const [wordCount, setWordCount] = useState<number>(30) // words for word mode
  const [textSource, setTextSource] = useState<TextSource>('random')
  const [includeNumbers, setIncludeNumbers] = useState(false)
  const [includePunctuation, setIncludePunctuation] = useState(false)
  const [customText, setCustomText] = useState('')
  const [quoteLength, setQuoteLength] = useState<QuoteLength>('all')
  const [quoteWordCount, setQuoteWordCount] = useState<number>(0) // Store total word count for current quote
  
  // Test state
  const [currentText, setCurrentText] = useState('')
  const [characters, setCharacters] = useState<CharacterData[]>([])
  const [userInput, setUserInput] = useState('')
  const [testStarted, setTestStarted] = useState(false)
  const [testFinished, setTestFinished] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [wordsRemaining, setWordsRemaining] = useState<number>(0)
  const [isRunning, setIsRunning] = useState(false)
  
  // Statistics
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [characterBreakdown, setCharacterBreakdown] = useState<CharacterBreakdown>({ correct: 0, incorrect: 0, missed: 0, extra: 0 })
  const [consistency, setConsistency] = useState(0)
  const [wpmHistory, setWpmHistory] = useState<WPMDataPoint[]>([])
  
  // UI state
  const [history, setHistory] = useState<TypingTestResult[]>([])
  
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastStatsTimeRef = useRef<number>(0)
  const secondCounterRef = useRef<number>(0)
  const userInputRef = useRef<string>('')
  const currentTextRef = useRef<string>('')

  // Initialize test on load
  useEffect(() => {
    initializeTest()
    setHistory(loadTypingHistory())
  }, [])

  // Auto-set word mode when quote is selected
  useEffect(() => {
    if (textSource === 'quote' && currentText) {
      // Set test mode to words
      setTestMode('words')
      // Calculate word count from quote
      const words = currentText.trim().split(/\s+/).filter(w => w.length > 0)
      const totalWords = words.length
      setWordCount(totalWords)
      setQuoteWordCount(totalWords)
    }
  }, [textSource, currentText])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (testStarted || testFinished)) {
        e.preventDefault()
        restartTest()
      }
      // Stop shortcut: Ctrl+Enter or Ctrl+Space
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === ' ')) {
        if (testStarted && !testFinished) {
          e.preventDefault()
          finishTest()
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [testStarted, testFinished])

  // Timer for time-based tests
  useEffect(() => {
    if (isRunning && testMode === 'time' && timeRemaining > 0 && !testFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            finishTest()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, testMode, timeRemaining, testFinished])

  // Update refs when userInput or currentText changes
  useEffect(() => {
    userInputRef.current = userInput
  }, [userInput])

  useEffect(() => {
    currentTextRef.current = currentText
  }, [currentText])

  // Stats collection interval (every second for graph)
  useEffect(() => {
    if (isRunning && testStarted && !testFinished) {
      // Reset counter when starting
      secondCounterRef.current = 0
      
      statsIntervalRef.current = setInterval(() => {
        secondCounterRef.current++
        // Use refs to get the latest values
        const latestInput = userInputRef.current
        const latestText = currentTextRef.current
        
        const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
        const elapsedMinutes = elapsedSeconds / 60
        
        // Calculate WPM based on correctly typed characters
        // Standard WPM formula: (correct characters / 5) / time in minutes
        const breakdown = calculateCharacterBreakdown(latestInput, latestText)
        const correctChars = breakdown.correct
        const currentWpm = elapsedMinutes > 0 ? (correctChars / 5) / elapsedMinutes : 0
        const currentIncorrect = breakdown.incorrect
        
        setWpmHistory((prev) => {
          // Use secondCounter to ensure each second gets a unique point
          const currentSecond = secondCounterRef.current
          const newPoint = { time: currentSecond, wpm: Math.round(currentWpm), incorrect: currentIncorrect }
          
          // Always add a new point for each second
          // The counter increments each second, so each point will have a unique time (1, 2, 3, ...)
          return [...prev, newPoint]
        })
      }, 1000) // Every second
    } else {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
        statsIntervalRef.current = null
      }
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
    }
  }, [isRunning, testStarted, testFinished])

  // Real-time stats calculation
  useEffect(() => {
    if (testStarted && !testFinished && userInput.length > 0) {
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
      const elapsedMinutes = elapsedSeconds / 60
      const charactersTyped = userInput.length
      
      // Calculate character breakdown
      const breakdown = calculateCharacterBreakdown(userInput, currentText)
      setCharacterBreakdown(breakdown)
      
      const correctChars = breakdown.correct
      const accuracyValue = charactersTyped > 0 ? (correctChars / charactersTyped) * 100 : 0
      // Calculate WPM based on correctly typed characters: (correct chars / 5) / minutes
      const wpmValue = elapsedMinutes > 0 ? (correctChars / 5) / elapsedMinutes : 0
      
      setWpm(Math.round(wpmValue))
      setAccuracy(Math.round(accuracyValue * 100) / 100)
      
      // Check if word-based test is complete
      if (testMode === 'words') {
        const inputWords = userInput.trim().split(/\s+/).filter(w => w.length > 0)
        const completedWords = inputWords.length
        const remaining = Math.max(0, wordCount - completedWords)
        setWordsRemaining(remaining)
        
        // Finish when all words are typed (check on space after last word)
        if (remaining === 0 && userInput.length > 0 && userInput[userInput.length - 1] === ' ') {
          finishTest()
        }
      }
    }
  }, [userInput, testStarted, testFinished, currentText, testMode, wordCount])

  // Update character states
  useEffect(() => {
    if (!testStarted || testFinished || characters.length === 0) return

    const inputChars = userInput.split('')
    const targetChars = currentText.split('')
    const updatedCharacters = [...characters]

    // Update character statuses
    for (let i = 0; i < Math.max(inputChars.length, targetChars.length); i++) {
      if (i < updatedCharacters.length) {
        const inputChar = inputChars[i]
        const targetChar = targetChars[i]

        if (i < inputChars.length && i < targetChars.length) {
          // Character has been typed
          if (inputChar === targetChar) {
            updatedCharacters[i] = { ...updatedCharacters[i], status: 'correct' }
          } else {
            updatedCharacters[i] = { ...updatedCharacters[i], status: 'incorrect' }
          }
        } else if (i < inputChars.length && i >= targetChars.length) {
          // Extra character typed
          // Don't update this character, it's beyond the target
        } else if (i >= inputChars.length && i < targetChars.length) {
          // Character not yet typed
          if (i === inputChars.length) {
            // Current character to type
            updatedCharacters[i] = { ...updatedCharacters[i], status: 'current' }
          } else {
            updatedCharacters[i] = { ...updatedCharacters[i], status: 'pending' }
          }
        }
      }
    }

    // Ensure current character is marked
    const currentIndex = inputChars.length
    if (currentIndex < updatedCharacters.length) {
      // Reset any other "current" status
      updatedCharacters.forEach((char, idx) => {
        if (char.status === 'current' && idx !== currentIndex) {
          updatedCharacters[idx] = { ...char, status: 'pending' }
        }
      })
      updatedCharacters[currentIndex] = { ...updatedCharacters[currentIndex], status: 'current' }
    }

    setCharacters(updatedCharacters)
  }, [userInput, testStarted, testFinished, currentText, characters.length])

  // Auto-stop on completion (quote/custom text) with debounce
  useEffect(() => {
    if (!testStarted || testFinished) return
    
    if ((textSource === 'quote' || textSource === 'custom') && userInput.length >= currentText.length) {
      const timeoutId = setTimeout(() => {
        if (isRunning && !testFinished) {
          finishTest()
        }
      }, 500) // 500ms debounce
      
      return () => clearTimeout(timeoutId)
    }
  }, [userInput, currentText, textSource, testStarted, testFinished, isRunning])

  function initializeTest() {
    generateText()
    setTestStarted(false)
    setTestFinished(false)
    setUserInput('')
    setWpm(0)
    setAccuracy(0)
    setCharacterBreakdown({ correct: 0, incorrect: 0, missed: 0, extra: 0 })
    setConsistency(0)
    setWpmHistory([])
    setIsRunning(false)
  }

  function generateText() {
    let text = ''
    
    if (textSource === 'random') {
      const options: RandomWordOptions = {
        wordCount: testMode === 'words' ? wordCount : 50, // Generate more for time mode
        includeNumbers,
        includePunctuation,
      }
      text = generateRandomWords(options)
    } else if (textSource === 'quote') {
      const quote = getRandomQuote(quoteLength)
      text = quote.text
      // Calculate and store word count
      const words = text.trim().split(/\s+/).filter(w => w.length > 0)
      setQuoteWordCount(words.length)
    } else {
      text = customText || ''
    }
    
    if (!text.trim()) {
      // If no text available, don't update
      return
    }
    
    setCurrentText(text)
    const textChars = text.split('')
    setCharacters(textChars.map((char, index) => ({ 
      char, 
      status: index === 0 ? 'current' : 'pending' 
    })))
    
    if (testMode === 'words') {
      setWordsRemaining(wordCount)
    } else {
      setTimeRemaining(duration)
    }
  }

  function calculateCharacterBreakdown(input: string, target: string): CharacterBreakdown {
    let correct = 0
    let incorrect = 0
    let missed = 0
    let extra = 0
    
    const inputChars = input.split('')
    const targetChars = target.split('')
    const maxLen = Math.max(inputChars.length, targetChars.length)
    
    for (let i = 0; i < maxLen; i++) {
      const inputChar = inputChars[i]
      const targetChar = targetChars[i]
      
      if (inputChar !== undefined && targetChar !== undefined) {
        if (inputChar === targetChar) {
          correct++
        } else {
          incorrect++
        }
      } else if (inputChar === undefined && targetChar !== undefined) {
        missed++
      } else if (inputChar !== undefined && targetChar === undefined) {
        extra++
      }
    }
    
    return { correct, incorrect, missed, extra }
  }

  function calculateConsistency(wpmHistory: WPMDataPoint[]): number {
    if (wpmHistory.length < 2) return 0
    
    const wpmValues = wpmHistory.map(p => p.wpm)
    const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length
    const variance = wpmValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / wpmValues.length
    const stdDev = Math.sqrt(variance)
    
    // Consistency as percentage (lower stdDev = higher consistency)
    // Normalize to 0-100 scale (assuming max stdDev of 50)
    return Math.max(0, Math.min(100, 100 - (stdDev / 50) * 100))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!testStarted || testFinished) {
      // Start test on first keystroke
      if (e.target.value.length > 0) {
        startTest()
        setUserInput(e.target.value)
      }
      return
    }
    
    setUserInput(e.target.value)
  }

  function startTest() {
    if (!currentText.trim()) {
      toast.error('Please configure test settings first')
      return
    }

    setTestStarted(true)
    setTestFinished(false)
    setIsRunning(true)
    startTimeRef.current = Date.now()
    lastStatsTimeRef.current = Date.now()
    secondCounterRef.current = 0
    
    // Initialize graph with starting point
    setWpmHistory([{ time: 0, wpm: 0, incorrect: 0 }])

    if (testMode === 'time') {
      setTimeRemaining(duration)
    } else {
      const typedWords = userInput.trim().split(/\s+/).filter(w => w.length > 0).length
      setWordsRemaining(Math.max(0, wordCount - typedWords))
    }

    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  function finishTest() {
    setIsRunning(false)
    setTestFinished(true)
    
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
    const elapsedMinutes = elapsedSeconds / 60
    const charactersTyped = userInput.length
    const breakdown = calculateCharacterBreakdown(userInput, currentText)
    const accuracyValue = charactersTyped > 0 ? (breakdown.correct / charactersTyped) * 100 : 0
    // Calculate WPM based on correctly typed characters: (correct chars / 5) / minutes
    const correctChars = breakdown.correct
    const wpmValue = elapsedMinutes > 0 ? (correctChars / 5) / elapsedMinutes : 0
    
    // Prepare final data point
    const finalPoint = { time: Math.round(elapsedSeconds), wpm: Math.round(wpmValue), incorrect: breakdown.incorrect }
    
    // Calculate updated history for consistency calculation
    let updatedHistory = wpmHistory
    if (wpmHistory.length === 0) {
      updatedHistory = [
        { time: 0, wpm: 0, incorrect: 0 },
        finalPoint
      ]
    } else {
      const lastPoint = wpmHistory[wpmHistory.length - 1]
      if (lastPoint.time !== finalPoint.time || lastPoint.wpm !== finalPoint.wpm || lastPoint.incorrect !== finalPoint.incorrect) {
        updatedHistory = [...wpmHistory, finalPoint]
      }
    }
    
    // Calculate consistency with updated history
    const consistencyValue = calculateConsistency(updatedHistory)
    
    // Add final data point to graph
    setWpmHistory(updatedHistory)
    setConsistency(consistencyValue)

    setWpm(Math.round(wpmValue))
    setAccuracy(Math.round(accuracyValue * 100) / 100)
    setCharacterBreakdown(breakdown)

    // Mark remaining characters as incorrect
    const updatedCharacters = characters.map((char, index) => {
      if (index >= userInput.length && (char.status === 'pending' || char.status === 'current')) {
        return { ...char, status: 'incorrect' as CharacterStatus }
      }
      return char
    })
    setCharacters(updatedCharacters)

    // Save to history
    const result: TypingTestResult = {
      id: `test-${Date.now()}`,
      date: new Date().toISOString(),
      duration: Math.round(elapsedSeconds),
      wpm: Math.round(wpmValue),
      accuracy: Math.round(accuracyValue * 100) / 100,
      charactersTyped,
      errors: breakdown.incorrect + breakdown.missed,
      consistency: consistencyValue,
      characterBreakdown: breakdown,
      testMode,
      textSource,
      wpmHistory: updatedHistory.map(p => ({ wpm: p.wpm, errors: p.incorrect })),
    }

    saveTypingHistory(result)
    setHistory(loadTypingHistory())
  }

  function restartTest() {
    initializeTest()
    generateText()
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function renderCharacterDisplay() {
    if (!currentText || characters.length === 0) return null

    const currentIndex = userInput.length

    return (
      <div className="relative">
        {/* Invisible input */}
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Tab') e.preventDefault()
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-default resize-none z-10"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        
        {/* Character display */}
        <div className="font-mono text-2xl leading-relaxed p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[300px] whitespace-pre-wrap break-words overflow-wrap-anywhere">
          <div className="relative">
            {characters.map((charData, index) => {
              const isCurrent = index === currentIndex && !testFinished
              const isCorrect = charData.status === 'correct'
              const isIncorrect = charData.status === 'incorrect'
              
              let charClass = 'text-gray-400 dark:text-gray-600'
              
              if (isCorrect) {
                charClass = 'text-gray-900 dark:text-gray-100'
              } else if (isIncorrect) {
                charClass = 'text-red-600 dark:text-red-400 underline'
              }

              return (
                <span key={index} className={`${charClass} relative`}>
                  {charData.char}
                  {isCurrent && (
                    <span className="absolute left-0 top-0 inline-block w-0.5 h-6 bg-primary-600 dark:bg-primary-400 animate-pulse" style={{ marginLeft: '-0.1rem' }} />
                  )}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  function exportResults(format: 'json' | 'csv') {
    if (history.length === 0) {
      toast.error('No history to export')
      return
    }

    if (format === 'json') {
      const json = JSON.stringify(history, null, 2)
      downloadFile(json, `typing-test-history-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
      toast.success('Results exported as JSON!')
    } else {
      const headers = ['Date', 'Duration (s)', 'WPM', 'Accuracy (%)', 'Consistency', 'Correct', 'Incorrect', 'Missed', 'Extra', 'Mode', 'Source']
      const rows = history.map((h) => [
        new Date(h.date).toLocaleString(),
        h.duration.toString(),
        h.wpm.toString(),
        h.accuracy.toString(),
        h.consistency?.toFixed(1) || '0',
        h.characterBreakdown?.correct || '0',
        h.characterBreakdown?.incorrect || '0',
        h.characterBreakdown?.missed || '0',
        h.characterBreakdown?.extra || '0',
        h.testMode || 'time',
        h.textSource || 'random',
      ])
      const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n')
      downloadFile(csv, `typing-test-history-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      toast.success('Results exported as CSV!')
    }
  }

  function clearHistory() {
    if (confirm('Are you sure you want to clear all test history?')) {
      clearTypingHistory()
      setHistory([])
      toast.success('History cleared!')
    }
  }

  // Regenerate text when config changes (only if test hasn't started)
  useEffect(() => {
    if (!testStarted) {
      // Only regenerate if we have valid text source
      if (textSource === 'random' || textSource === 'quote' || (textSource === 'custom' && customText.trim())) {
        generateText()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testMode, wordCount, duration, textSource, includeNumbers, includePunctuation, quoteLength])

  return (
    <ToolPage
      title="Typing Test"
      description="Measure your typing speed (WPM) and accuracy. Start typing immediately or configure test options."
      keywords="typing test, WPM, words per minute, typing speed, typing accuracy, typing practice"
    >
      <div className="space-y-6">
        {/* Always Visible Test Options */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Test Mode */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Mode:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setTestMode('time')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    testMode === 'time'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Clock className="h-3 w-3 inline mr-1" />
                  Time
                </button>
                <button
                  onClick={() => setTestMode('words')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    testMode === 'words'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Hash className="h-3 w-3 inline mr-1" />
                  Words
                </button>
              </div>
            </div>

            {/* Duration/Word Count */}
            {testMode === 'time' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Duration:</span>
                <div className="flex gap-1">
                  {[15, 30, 60, 120].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setDuration(sec)}
                      className={`px-2 py-1 text-xs rounded ${
                        duration === sec
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="10"
                  max="600"
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Custom"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Words:</span>
                {textSource === 'quote' ? (
                  <span className="text-xs text-gray-700 dark:text-gray-300">
                    {quoteWordCount > 0 ? `${quoteWordCount} (from quote)` : 'Loading...'}
                  </span>
                ) : (
                  <>
                    <div className="flex gap-1">
                      {[10, 25, 50, 100].map((count) => (
                        <button
                          key={count}
                          onClick={() => setWordCount(count)}
                          className={`px-2 py-1 text-xs rounded ${
                            wordCount === count
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={wordCount}
                      onChange={(e) => setWordCount(Number(e.target.value))}
                      min="5"
                      max="500"
                      className="w-16 px-2 py-1 text-xs"
                      placeholder="Custom"
                    />
                  </>
                )}
              </div>
            )}

            {/* Text Source */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Source:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setTextSource('random')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    textSource === 'random'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Random
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTextSource('quote')}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      textSource === 'quote'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Quote
                  </button>
                  {textSource === 'quote' && (
                    <button
                      onClick={() => generateText()}
                      className="p-1 text-xs rounded font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      title="Refresh quote"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setTextSource('custom')}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    textSource === 'custom'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Random Options - Numbers and Punctuation */}
            {textSource === 'random' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Options:</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="w-3 h-3 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Numbers</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePunctuation}
                    onChange={(e) => setIncludePunctuation(e.target.checked)}
                    className="w-3 h-3 text-primary-600 focus:ring-primary-500 rounded"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Punctuation</span>
                </label>
              </div>
            )}

            {/* Quote Options - Length Filter */}
            {textSource === 'quote' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Length:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setQuoteLength('all')}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      quoteLength === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setQuoteLength('short')}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      quoteLength === 'short'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Short
                  </button>
                  <button
                    onClick={() => setQuoteLength('medium')}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      quoteLength === 'medium'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setQuoteLength('long')}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      quoteLength === 'long'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Long
                  </button>
                </div>
              </div>
            )}

            {/* Custom Text Input */}
            {textSource === 'custom' && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Custom:</span>
                <Textarea
                  variant="primary"
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value)
                    if (!testStarted) {
                      setTimeout(() => generateText(), 100)
                    }
                  }}
                  placeholder="Enter custom text..."
                  className="flex-1 px-2 py-1 text-xs resize-none min-h-[2rem] max-h-20"
                  rows={1}
                />
              </div>
            )}
          </div>
        </div>


        {/* Live Stats - During Test */}
        {(testStarted || testFinished) && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {testMode === 'time' ? 'Time' : textSource === 'quote' ? 'Words' : 'Words Left'}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {testMode === 'time' 
                    ? formatTime(timeRemaining) 
                    : textSource === 'quote' && quoteWordCount > 0
                      ? `${wordsRemaining} / ${quoteWordCount}`
                      : wordsRemaining}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">WPM</div>
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{wpm}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{accuracy.toFixed(1)}%</div>
              </div>
            </div>
            {testStarted && !testFinished && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">ESC</kbd> to restart or <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> to stop
                </p>
              </div>
            )}
          </div>
        )}

        {/* Character Display or Results Panel */}
        {testFinished ? (
          /* Results Panel */
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Test Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">WPM</div>
                  <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{wpm}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Accuracy</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{accuracy.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Consistency</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{consistency.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.round((Date.now() - startTimeRef.current) / 1000)}s
                  </div>
                </div>
              </div>
            </div>

            {/* Character Breakdown */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Character Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {characterBreakdown.correct}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Correct</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {characterBreakdown.incorrect}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Incorrect</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {characterBreakdown.missed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Missed</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {characterBreakdown.extra}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Extra</div>
                </div>
              </div>
            </div>

            {/* WPM Graph */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">WPM & Errors Over Time</h3>
              {wpmHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={wpmHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                      stroke="#6b7280"
                      type="number"
                      domain={[0, 'dataMax']}
                      allowDuplicatedCategory={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'WPM', angle: -90, position: 'insideLeft' }}
                      stroke="#3b82f6"
                      domain={[0, 'auto']}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Incorrect', angle: 90, position: 'insideRight' }}
                      stroke="#ef4444"
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'wpm') return [`${value} WPM`, 'WPM']
                        if (name === 'incorrect') return [`${value}`, 'Incorrect']
                        return [value, name]
                      }}
                      labelFormatter={(label: any) => `Time: ${label}s`}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="wpm" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      isAnimationActive={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="incorrect" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No graph data available</p>
                </div>
              )}
            </div>

            {/* Restart Button */}
            <div className="flex justify-center">
              <button
                onClick={restartTest}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Restart Test</span>
              </button>
            </div>
          </div>
        ) : (
          /* Character Display */
          currentText && (
            <div>
              {renderCharacterDisplay()}
              {!testStarted && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Start typing to begin the test
                </div>
              )}
            </div>
          )
        )}

        {/* History */}
        {!testStarted && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Test History</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportResults('json')}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => exportResults('csv')}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={clearHistory}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No test history yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Date</th>
                      <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">Mode</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">WPM</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Accuracy</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Consistency</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Correct</th>
                      <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">Incorrect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((result) => (
                      <tr key={result.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {result.testMode || 'time'}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900 dark:text-white font-medium">
                          {result.wpm}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900 dark:text-white">
                          {result.accuracy.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                          {result.consistency?.toFixed(1) || '0'}%
                        </td>
                        <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">
                          {result.characterBreakdown?.correct || 0}
                        </td>
                        <td className="py-2 px-3 text-right text-red-600 dark:text-red-400">
                          {result.characterBreakdown?.incorrect || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}
