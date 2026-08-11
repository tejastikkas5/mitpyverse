'use me';
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveAnswerAction, evaluateAndSubmitAttemptAction } from '@/services/attempts';
import { reportViolationAction } from '@/services/monitoring';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { QuestionOptionLabel } from '@/types/database';
import { useRouter } from 'next/navigation';

interface ExamClientProps {
  attemptId: string;
  testTitle: string;
  durationMinutes: number;
  initialRemainingSeconds: number;
  questions: any[];
  savedAnswers: Record<string, { selected_option?: QuestionOptionLabel; is_marked_for_review: boolean }>;
  fullscreenRequired: boolean;
  allowBackNav: boolean;
  showResultScore: boolean;
}

export function ExamClient({
  attemptId,
  testTitle,
  initialRemainingSeconds,
  questions,
  savedAnswers: initialSavedAnswers,
  fullscreenRequired,
  allowBackNav,
}: ExamClientProps) {
  const router = useRouter();

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers & Review state map
  const [answers, setAnswers] = useState<
    Record<string, { selected_option?: QuestionOptionLabel | null; is_marked_for_review: boolean }>
  >(initialSavedAnswers);

  // Server-authoritative countdown timer state
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<any | null>(null);

  // Anti-Cheating Violation UI Modal State
  const [violationNotice, setViolationNotice] = useState<{ title: string; count: number; max: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Helper: Trigger Violation Server-Side
  async function triggerViolation(type: any, title: string) {
    if (submittedScore) return;

    const res = await reportViolationAction(attemptId, type);
    if (res.success) {
      if (res.isTerminated) {
        setSubmittedScore({ isTerminated: true });
        setViolationNotice(null);
      } else {
        setViolationNotice({
          title,
          count: res.violationCount || 1,
          max: res.maxViolations || 3,
        });
      }
    }
  }

  // 1. Anti-Cheating Event Listeners Setup
  useEffect(() => {
    if (submittedScore) return;

    // A. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);

      if (fullscreenRequired && !inFullscreen) {
        triggerViolation('fullscreen_exit', 'Fullscreen Mode Exited');
      }
    };

    // Check initial fullscreen state on mount
    if (fullscreenRequired && typeof window !== 'undefined') {
      setIsFullscreen(!!document.fullscreenElement);
    }

    // B. Tab Switch Detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation('tab_switch', 'Tab Switched / Hidden');
      }
    };

    // C. Window Blur Detection
    const handleBlur = () => {
      triggerViolation('window_blur', 'Exam Window Lost Focus');
    };

    // D. Copy / Paste / Cut Restrictions
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('copy_attempt', 'Copy Attempt Blocked');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('paste_attempt', 'Paste Attempt Blocked');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('cut_attempt', 'Cut Attempt Blocked');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [submittedScore, fullscreenRequired]);

  const currentQ = questions[currentIndex];
  const currentAnswerState = currentQ ? answers[currentQ.id] || { selected_option: null, is_marked_for_review: false } : null;

  // 1. Server-authoritative timer tick (1 second intervals)
  useEffect(() => {
    if (remainingSeconds <= 0 || submittedScore) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(); // Auto-submit when countdown hits zero
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, submittedScore]);

  // 2. Periodic Auto-Save every 30 seconds
  useEffect(() => {
    const autoSaveTimer = setInterval(() => {
      if (currentQ && currentAnswerState && !submittedScore) {
        syncAnswerToServer(currentQ.id, currentAnswerState.selected_option || null, currentAnswerState.is_marked_for_review);
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [currentIndex, answers, submittedScore]);

  // Sync answer selection immediately to server
  async function syncAnswerToServer(
    questionId: string,
    option: QuestionOptionLabel | null,
    marked: boolean
  ) {
    setSaveStatus('saving');
    const res = await saveAnswerAction(attemptId, questionId, option, marked);
    if (res.success) {
      setSaveStatus('saved');
    } else {
      setSaveStatus('error');
    }
  }

  // Handle MCQ option selection
  function handleSelectOption(optionLabel: QuestionOptionLabel) {
    if (submittedScore) return;

    const newOption = currentAnswerState?.selected_option === optionLabel ? null : optionLabel;
    const isMarked = currentAnswerState?.is_marked_for_review || false;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selected_option: newOption,
        is_marked_for_review: isMarked,
      },
    }));

    syncAnswerToServer(currentQ.id, newOption, isMarked);
  }

  // Handle Mark for Review toggle
  function handleToggleMarkForReview() {
    if (submittedScore) return;

    const currentOpt = currentAnswerState?.selected_option || null;
    const newMarked = !currentAnswerState?.is_marked_for_review;

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        selected_option: currentOpt,
        is_marked_for_review: newMarked,
      },
    }));

    syncAnswerToServer(currentQ.id, currentOpt, newMarked);
  }

  // Handle Auto-submit on timer expiry
  async function handleAutoSubmit() {
    if (submitting || submittedScore) return;
    setSubmitting(true);
    const res = await evaluateAndSubmitAttemptAction(attemptId, 'auto_submitted');
    if (res.success && res.score) {
      setSubmittedScore(res.score);
    } else {
      alert('Failed to submit exam automatically');
    }
    setSubmitting(false);
  }

  // Handle Manual Submit confirmation
  async function handleManualSubmit() {
    setSubmitting(true);
    const res = await evaluateAndSubmitAttemptAction(attemptId, 'submitted');
    if (res.success && res.score) {
      setSubmittedScore(res.score);
      setShowSubmitModal(false);
    } else {
      alert(res.error || 'Submission failed');
    }
    setSubmitting(false);
  }

  // Format countdown string MM:SS
  function formatTimer(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Calculate question summary counts
  const totalQ = questions.length;
  let answeredCount = 0;
  let markedCount = 0;

  Object.values(answers).forEach((a) => {
    if (a.selected_option) answeredCount++;
    if (a.is_marked_for_review) markedCount++;
  });

  // SUBMISSION CONFIRMATION SCREEN
  if (submittedScore) {
    return (
      <div className="max-w-xl mx-auto space-y-6 my-12 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 font-black text-3xl items-center justify-center border border-emerald-200 shadow-sm mx-auto">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Thank You! Your Test Has Been Submitted.</h1>
          <p className="text-sm text-slate-500 mt-1">Your responses have been securely recorded and evaluated.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm space-y-6 text-center">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
            Official test results and analytics will be compiled by the administrator.
          </div>
          <Link href="/student/dashboard" className="block">
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <Card className="text-center p-8 text-slate-500">
        No questions found for this exam.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* EXAM HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white border border-slate-200/80 shadow-sm rounded-2xl">
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-none">{testTitle}</h1>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <span>Question {currentIndex + 1} of {totalQ}</span>
            <span>•</span>
            <span className="capitalize text-indigo-600 font-bold">
              {saveStatus === 'saving' ? 'Syncing answer...' : saveStatus === 'error' ? '⚠️ Sync error' : '✓ Auto-Saved'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* COUNTDOWN TIMER */}
          <div className={`px-4 py-2 rounded-xl border font-mono text-base font-bold flex items-center gap-2 ${
            remainingSeconds < 300
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            <span>⏱️</span>
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all"
          >
            Submit Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* QUESTION DISPLAY PANEL */}
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md shadow-indigo-600/20">
                  Q{currentIndex + 1}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs rounded-lg">
                  {currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-relaxed">
              {currentQ.question_text}
            </h2>

            {/* MCQ OPTIONS */}
            <div className="space-y-3 pt-2">
              {currentQ.options?.map((opt: any) => {
                const isSelected = currentAnswerState?.selected_option === opt.option_label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.option_label)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-semibold shadow-md ring-2 ring-indigo-600/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center transition-all ${
                      isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 border border-slate-200 text-slate-600'
                    }`}>
                      {opt.option_label}
                    </span>
                    <span className="text-sm">{opt.option_text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NAVIGATION FOOTER */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              disabled={currentIndex === 0 || !allowBackNav}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              ← Previous Question
            </Button>

            <Button
              variant="primary"
              disabled={currentIndex === totalQ - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
            >
              Next Question →
            </Button>
          </div>
        </div>

        {/* QUESTION NAVIGATION PANEL (SIDEBAR) */}
        <div>
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Question Palette</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const state = answers[q.id];
                const isAns = !!state?.selected_option;
                const isCur = idx === currentIndex;

                let btnBg = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                if (isAns) btnBg = 'bg-emerald-100 border-emerald-300 text-emerald-900 font-black';

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-extrabold border transition-all ${btnBg} ${
                      isCur ? 'ring-2 ring-indigo-600 scale-105 shadow-sm' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-50 border border-slate-200" />
                <span>Unanswered ({totalQ - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN REQUIRED MODAL OVERLAY */}
      {fullscreenRequired && !isFullscreen && !submittedScore && !violationNotice && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-extrabold text-2xl flex items-center justify-center mx-auto shadow-inner">
              🖥️
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Fullscreen Required</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                This examination requires full-screen mode to maintain test integrity. Click below to enter fullscreen.
              </p>
            </div>
            <button
              onClick={() => {
                if (document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              🚀 Enter Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* VIOLATION WARNING MODAL */}
      {violationNotice && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md">
            <Card className="border-rose-500/50 bg-slate-900 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-2xl flex items-center justify-center mx-auto border border-rose-500/30">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-rose-400">Examination Integrity Warning</h2>
              <p className="text-sm text-slate-300">{violationNotice.title}</p>

              <div className="p-3 bg-rose-950/30 rounded-lg border border-rose-500/20 font-mono text-sm text-rose-300">
                Violation Count: <span className="font-extrabold">{violationNotice.count}</span> / {violationNotice.max}
              </div>

              <p className="text-xs text-slate-400">
                Exceeding maximum allowed violations will result in automatic examination termination and submission.
              </p>

              <Button
                className="w-full"
                onClick={() => {
                  if (fullscreenRequired && !document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                  setViolationNotice(null);
                }}
              >
                Return to Exam
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Confirm Examination Submission</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to submit your examination? Once submitted, your answers will be locked and evaluated.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-mono text-slate-700">
              <div className="flex justify-between"><span>Total Questions:</span> <span className="font-bold">{totalQ}</span></div>
              <div className="flex justify-between"><span>Answered:</span> <span className="text-emerald-600 font-extrabold">{answeredCount}</span></div>
              <div className="flex justify-between"><span>Unanswered:</span> <span className="text-rose-600 font-extrabold">{totalQ - answeredCount}</span></div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Continue Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleManualSubmit}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
