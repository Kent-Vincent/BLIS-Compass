
export enum UserRole {
  STUDENT = 'student',
  FACULTY = 'faculty',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  level: number;
  exp: number;
  streak: number;
}

export interface GameCard {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface MockExam {
  id: string;
  title: string;
  duration_minutes: number;
  total_items: number;
  completed_count: number;
  created_by: string;
  is_published: boolean;
  created_at: string;
}

export interface MockExamItem {
  id: string;
  exam_id: string;
  item_no: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: string;
  subject_id?: string;
  created_at: string;
}

export interface MockExamAttempt {
  id: string;
  student_id: string;
  exam_id: string;
  score: number;
  total_items: number;
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  time_left_seconds: number;
  current_index: number;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PracticeSubject {
  id: string;
  name: string;
  created_at: string;
}

export interface PracticeQuestion {
  id: string;
  subject_id: string;
  part: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: string;
  explanation?: string;
  created_by: string;
  updated_at: string;
  created_at: string;
}

export interface PracticeProgress {
  student_id: string;
  subject_id: string;
  highest_unlocked_part: number;
  best_score_part1: number;
  best_score_part2: number;
  best_score_part3: number;
  best_score_part4: number;
  best_score_part5: number;
  updated_at: string;
}

export interface PracticeAttempt {
  id: string;
  student_id: string;
  subject_id: string;
  part: number;
  total_items: number;
  correct_count: number;
  score: number;
  passed: boolean;
  attempt_no: number;
  created_at: string;
}
