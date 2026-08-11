import { getExamStateAction } from '@/services/attempts';
import { ExamClient } from './ExamClient';
import { notFound, redirect } from 'next/navigation';

export default async function ExamPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const state = await getExamStateAction(attemptId);

  if (!state.success || !state.attempt) {
    notFound();
  }

  // If already submitted or auto-submitted, redirect to dashboard or show submitted state
  if (state.attempt.status === 'submitted' || state.attempt.status === 'auto_submitted' || state.attempt.status === 'force_submitted') {
    redirect('/student/dashboard');
  }

  return (
    <ExamClient
      attemptId={attemptId}
      testTitle={state.test?.title || 'MITPyVerse Examination'}
      durationMinutes={state.test?.duration_minutes || 60}
      initialRemainingSeconds={state.remainingSeconds || 0}
      questions={state.questions || []}
      savedAnswers={state.savedAnswers || {}}
      fullscreenRequired={state.settings?.fullscreen_required ?? true}
      allowBackNav={state.settings?.allow_back_navigation ?? true}
      showResultScore={state.settings?.show_result_after_submission ?? false}
    />
  );
}
