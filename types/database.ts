export type TestStatus = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'archived';
export type SessionStatus = 'pending' | 'running' | 'paused' | 'completed';
export type StudentAssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'absent';
export type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'auto_submitted' | 'force_submitted';
export type QuestionOptionLabel = 'A' | 'B' | 'C' | 'D';
export type ViolationType = 
  | 'fullscreen_exit'
  | 'tab_switch'
  | 'window_blur'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'cut_attempt'
  | 'right_click'
  | 'other';

export interface Student {
  id: string;
  student_code: string;
  name: string;
  password_hash: string;
  raw_password?: string | null;
  email?: string | null;
  phone?: string;
  course?: string;
  year?: string;
  division?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  status: TestStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TestSettings {
  id: string;
  test_id: string;
  fullscreen_required: boolean;
  allow_back_navigation: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  max_violations: number;
  auto_submit_on_violation: boolean;
  show_result_after_submission: boolean;
  allow_retake: boolean;
  auto_save_answers: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  test_id: string;
  name: string;
  status: SessionStatus;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TestStudent {
  id: string;
  test_id: string;
  student_id: string;
  session_id?: string;
  status: StudentAssignmentStatus;
  assigned_at: string;
}

export interface Question {
  id: string;
  test_id: string;
  session_id?: string;
  question_text: string;
  question_type: 'mcq';
  marks: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_label: QuestionOptionLabel;
  option_text: string;
  created_at: string;
}

export interface AnswerKey {
  id: string;
  question_id: string;
  correct_option: QuestionOptionLabel;
  created_at: string;
  updated_at: string;
}

export interface ExamAttempt {
  id: string;
  test_id: string;
  student_id: string;
  session_id?: string;
  status: AttemptStatus;
  started_at?: string;
  submitted_at?: string;
  time_taken_seconds?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option?: QuestionOptionLabel;
  is_marked_for_review: boolean;
  answered_at?: string;
  updated_at: string;
}

export interface Score {
  id: string;
  attempt_id: string;
  test_id: string;
  student_id: string;
  session_id?: string;
  score: number;
  total_marks: number;
  percentage: number;
  rank?: number;
  evaluated_at: string;
  created_at: string;
}

export interface ExamViolation {
  id: string;
  attempt_id: string;
  student_id: string;
  test_id: string;
  violation_type: ViolationType;
  occurred_at: string;
}
