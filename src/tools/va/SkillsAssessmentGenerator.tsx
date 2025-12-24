import { useState, useEffect, useRef } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Plus, Trash2, Edit2, Save, X, Eye, FileDown, Share2, CheckCircle2, List, FileText, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard } from '../../utils/copyToClipboard'
import { downloadFile } from '../../utils/dev/fileHandler'
import {
  type Question,
  type QuestionType,
  type Assessment,
  createEmptyAssessment,
  createQuestion,
  getTemplates,
  getTemplateNames,
} from '../../utils/va/assessmentTemplates'
import {
  saveAssessment,
  loadAssessments,
  loadAssessment,
  deleteAssessment,
  type SavedAssessment,
} from '../../utils/va/storage'

type Mode = 'builder' | 'take' | 'preview'

export default function SkillsAssessmentGenerator() {
  const [mode, setMode] = useState<Mode>('builder')
  const [assessment, setAssessment] = useState<Assessment>(createEmptyAssessment())
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [showResults, setShowResults] = useState(false)
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  
  const questionDropdownRef = useRef<HTMLDivElement>(null)
  const actionsMenuRef = useRef<HTMLDivElement>(null)

  const templates = getTemplates()
  const templateNames = getTemplateNames()

  useEffect(() => {
    setSavedAssessments(loadAssessments())
    
    // Check URL hash for shared assessment
    const hash = window.location.hash.slice(1)
    if (hash) {
      try {
        const sharedAssessment = loadAssessment(hash)
        if (sharedAssessment) {
          setAssessment(sharedAssessment as Assessment)
          setSelectedAssessmentId(hash)
          toast.success('Loaded shared assessment')
        }
      } catch (error) {
        console.error('Failed to load shared assessment:', error)
      }
    }
  }, [])

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (questionDropdownRef.current && !questionDropdownRef.current.contains(event.target as Node)) {
        setShowQuestionDropdown(false)
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleAddQuestion(type: QuestionType) {
    const newQuestion = createQuestion(
      type,
      'Enter your question here',
      true,
      type === 'multiple-choice' ? ['Option 1', 'Option 2'] : undefined,
      type === 'rating' ? 5 : undefined
    )
    // Don't add to assessment yet - only add when saved
    setEditingQuestion(newQuestion)
    setShowQuestionDropdown(false)
  }

  function handleEditQuestion(question: Question) {
    setEditingQuestion({ ...question })
  }

  function handleSaveQuestion() {
    if (!editingQuestion) return

    if (editingQuestion.question.trim() === '') {
      toast.error('Question text cannot be empty')
      return
    }

    if (editingQuestion.type === 'multiple-choice' && (!editingQuestion.options || editingQuestion.options.length < 2)) {
      toast.error('Multiple choice questions need at least 2 options')
      return
    }

    const index = assessment.questions.findIndex((q) => q.id === editingQuestion.id)
    if (index >= 0) {
      const updated = [...assessment.questions]
      updated[index] = editingQuestion
      setAssessment({ ...assessment, questions: updated })
    } else {
      setAssessment({ ...assessment, questions: [...assessment.questions, editingQuestion] })
    }

    setEditingQuestion(null)
    toast.success('Question saved')
  }

  function handleDeleteQuestion(id: string) {
    if (confirm('Are you sure you want to delete this question?')) {
      setAssessment({
        ...assessment,
        questions: assessment.questions.filter((q) => q.id !== id),
      })
      toast.success('Question deleted')
    }
  }

  function handleLoadTemplate() {
    if (!selectedTemplate) return
    const template = templates[selectedTemplate]
    if (template) {
      setAssessment({
        ...assessment,
        questions: [...assessment.questions, ...template.map((q) => ({ ...q, id: `q-${Date.now()}-${Math.random()}` }))],
      })
      setSelectedTemplate('')
      toast.success('Template loaded')
    }
  }

  function handleSaveAssessment() {
    if (assessment.title.trim() === '') {
      toast.error('Assessment title is required')
      return
    }

    const saved: SavedAssessment = {
      ...assessment,
      createdAt: assessment.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveAssessment(saved)
    setSavedAssessments(loadAssessments())
    setSelectedAssessmentId(saved.id)
    toast.success('Assessment saved!')
  }

  function handleLoadAssessment(id: string) {
    const loaded = loadAssessment(id)
    if (loaded) {
      setAssessment(loaded as Assessment)
      setSelectedAssessmentId(id)
      setMode('builder')
      setAnswers({})
      setShowResults(false)
      toast.success('Assessment loaded')
    }
  }

  function handleDeleteAssessment(id: string) {
    if (confirm('Are you sure you want to delete this assessment?')) {
      deleteAssessment(id)
      setSavedAssessments(loadAssessments())
      if (selectedAssessmentId === id) {
        setAssessment(createEmptyAssessment())
        setSelectedAssessmentId(null)
      }
      toast.success('Assessment deleted')
    }
  }

  function handleExportAssessment() {
    const json = JSON.stringify(assessment, null, 2)
    downloadFile(json, `assessment-${assessment.title.replace(/\s+/g, '-')}-${Date.now()}.json`, 'application/json')
    toast.success('Assessment exported!')
  }

  function handleShareAssessment() {
    if (!selectedAssessmentId) {
      toast.error('Please save the assessment first')
      return
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}#${selectedAssessmentId}`
    copyToClipboard(shareUrl, 'Share link copied!')
  }


  function handleSubmitAssessment() {
    const requiredQuestions = assessment.questions.filter((q) => q.required)
    const unanswered = requiredQuestions.filter((q) => !answers[q.id] || answers[q.id] === '')
    
    if (unanswered.length > 0) {
      toast.error(`Please answer ${unanswered.length} required question(s)`)
      return
    }

    setShowResults(true)
    toast.success('Assessment submitted!')
  }

  function getQuestionTypeColor(type: QuestionType) {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case 'text':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      case 'rating':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
      case 'yes-no':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
      default:
        return 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
    }
  }

  function renderQuestionBuilder(question: Question) {
    return (
      <div key={question.id} className="group border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getQuestionTypeColor(question.type)}`}>
                {question.type.replace('-', ' ')}
              </span>
              {question.required && (
                <span className="px-2.5 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full">
                  Required
                </span>
              )}
            </div>
            <p className="text-gray-900 dark:text-white font-medium text-base mb-3">{question.question}</p>
            {question.type === 'multiple-choice' && question.options && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mt-2">
                <ul className="space-y-2">
                  {question.options.map((opt, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {question.type === 'rating' && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Rating scale: <span className="font-medium">1-{question.ratingScale || 5}</span>
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEditQuestion(question)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              title="Edit question"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteQuestion(question.id)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderQuestionInput(question: Question) {
    const answer = answers[question.id] || ''

    return (
      <div key={question.id} className="mb-6 !m-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {question.question}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {question.type === 'multiple-choice' && question.options && (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <textarea
            value={answer as string}
            onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={4}
            placeholder="Enter your answer..."
          />
        )}

        {question.type === 'rating' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">1</span>
            <input
              type="range"
              min="1"
              max={question.ratingScale || 5}
              value={answer as number || 1}
              onChange={(e) => setAnswers({ ...answers, [question.id]: Number(e.target.value) })}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{question.ratingScale || 5}</span>
            <span className="text-lg font-semibold text-primary-600 dark:text-primary-400 min-w-[2rem] text-center">
              {answer as number || 1}
            </span>
          </div>
        )}

        {question.type === 'yes-no' && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={answer === 'yes'}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={answer === 'no'}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 dark:text-gray-300">No</span>
            </label>
          </div>
        )}
      </div>
    )
  }

  return (
    <ToolPage
      title="Skills Assessment Generator"
      description="Create customizable assessment forms for evaluating virtual assistant skills with multiple question types."
      keywords="skills assessment, assessment generator, questionnaire, survey, VA skills test"
    >
      <div className="space-y-6">
        {/* Mode Selector - Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1" aria-label="Tabs">
          <button
            onClick={() => setMode('builder')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'builder'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4" />
              Builder
          </button>
          <button
            onClick={() => {
              if (assessment.questions.length > 0) {
                setMode('take')
                setAnswers({})
                setShowResults(false)
              } else {
                toast.error('Add questions first')
              }
            }}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'take'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <List className="h-4 w-4" />
              Take Assessment
          </button>
          <button
            onClick={() => setMode('preview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'preview'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Eye className="h-4 w-4" />
              Preview
          </button>
          </nav>
        </div>

        {mode === 'builder' && (
          <>
            {/* Assessment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={assessment.title}
                  onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter assessment title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={assessment.description}
                  onChange={(e) => setAssessment({ ...assessment, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>

            {/* Templates */}
            <div className="flex items-center gap-3">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Load question template...</option>
                {templateNames.map((name) => (
                  <option key={name} value={name}>
                    {name.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLoadTemplate}
                disabled={!selectedTemplate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Load Template
              </button>
            </div>

            {/* Question Builder */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h3>
                
                {/* Dropdown for Question Types */}
                <div className="relative" ref={questionDropdownRef}>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowQuestionDropdown(!showQuestionDropdown)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Question</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showQuestionDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleAddQuestion('multiple-choice')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => handleAddQuestion('text')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Text
                  </button>
                  <button
                    onClick={() => handleAddQuestion('rating')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Rating
                  </button>
                  <button
                    onClick={() => handleAddQuestion('yes-no')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Yes/No
                  </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {assessment.questions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No questions yet. Add a question to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {assessment.questions.map((q) => renderQuestionBuilder(q))}
                </div>
              )}
            </div>

            {/* Edit Question Modal */}
            {editingQuestion && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Question</h3>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Question Text
                      </label>
                      <textarea
                        value={editingQuestion.question}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, question: e.target.value })
                        }
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingQuestion.required}
                          onChange={(e) =>
                            setEditingQuestion({ ...editingQuestion, required: e.target.checked })
                          }
                          className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                      </label>
                    </div>

                    {editingQuestion.type === 'multiple-choice' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Options (one per line)
                        </label>
                        <textarea
                          value={editingQuestion.options?.join('\n') || ''}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              options: e.target.value.split('\n').filter((o) => o.trim()),
                            })
                          }
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={4}
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}

                    {editingQuestion.type === 'rating' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Rating Scale
                        </label>
                        <select
                          value={editingQuestion.ratingScale || 5}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              ratingScale: Number(e.target.value) as 5 | 10,
                            })
                          }
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value={5}>1-5</option>
                          <option value={10}>1-10</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setEditingQuestion(null)}
                        className="px-5 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveQuestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Question</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions - Better Hierarchy */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {/* Primary Action */}
              <button
                onClick={handleSaveAssessment}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save Assessment</span>
              </button>
                
                {/* Secondary Actions Menu */}
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowActionsMenu(!showActionsMenu)
                    }}
                  >
                    <span>More</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showActionsMenu && (
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <div className="py-1">
              <button
                          onClick={() => {
                            handleExportAssessment()
                            setShowActionsMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                          Export JSON
              </button>
              {selectedAssessmentId && (
                <button
                            onClick={() => {
                              handleShareAssessment()
                              setShowActionsMenu(false)
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                            Share Link
                </button>
              )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Question Count Badge */}
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {assessment.questions.length} {assessment.questions.length === 1 ? 'question' : 'questions'}
              </div>
            </div>
          </>
        )}

        {mode === 'take' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{assessment.title}</h2>
              {assessment.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{assessment.description}</p>
              )}
              {/* Progress indicator */}
              {!showResults && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>
                      {Object.keys(answers).filter(k => answers[k] !== '').length} / {assessment.questions.length} answered
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(Object.keys(answers).filter(k => answers[k] !== '').length / assessment.questions.length) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {!showResults ? (
              <>
                <div className="space-y-6">
                  {assessment.questions.map((q, index) => (
                    <div key={q.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          {renderQuestionInput(q)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSubmitAssessment}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Submit Assessment</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-6">
                  <CheckCircle2 className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">Assessment Submitted!</h3>
                </div>
                <div className="space-y-4">
                  {assessment.questions.map((q, index) => (
                    <div key={q.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-semibold text-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">{q.question}</p>
                          <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded px-3 py-2">
                            <span className="font-medium">Answer:</span> {answers[q.id] || 'Not answered'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'preview' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{assessment.title}</h2>
              {assessment.description && (
                <p className="text-gray-600 dark:text-gray-400">{assessment.description}</p>
              )}
            </div>
            <div className="space-y-6">
              {assessment.questions.map((q) => renderQuestionInput(q))}
            </div>
          </div>
        )}

        {/* Saved Assessments */}
        {savedAssessments.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Saved Assessments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedAssessments.map((assess) => (
                <div
                  key={assess.id}
                  className="group p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{assess.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {assess.questions.length} {assess.questions.length === 1 ? 'question' : 'questions'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Updated {new Date(assess.updatedAt).toLocaleDateString()}
                    </p>
                    </div>
                  </div>
                  
                  {/* Actions - Full width buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleLoadAssessment(assess.id)}
                      className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteAssessment(assess.id)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete assessment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

