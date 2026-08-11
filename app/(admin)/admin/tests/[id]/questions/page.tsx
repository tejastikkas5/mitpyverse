import { getTestByIdAction } from '@/services/tests';
import { getQuestionsByTestIdAction } from '@/services/questions';
import { getSessionsByTestIdAction } from '@/services/sessions';
import { QuestionsClient } from './QuestionsClient';
import { TestDashboardTabs } from '../TestDashboardTabs';
import { notFound } from 'next/navigation';

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test } = await getTestByIdAction(id);

  if (!test) notFound();

  const { questions } = await getQuestionsByTestIdAction(id);
  const { sessions } = await getSessionsByTestIdAction(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{test.title}</h1>
      </div>
      <TestDashboardTabs testId={id} active="questions" />
      <QuestionsClient testId={id} initialQuestions={questions || []} sessions={sessions || []} />
    </div>
  );
}
