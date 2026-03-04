
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
  created_at: string;
}
