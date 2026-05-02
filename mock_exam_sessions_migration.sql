
-- Migration for Subject-based Scheduled Mock Exam Sessions

-- 1. Create mock_exam_subject_sessions table
CREATE TABLE IF NOT EXISTS mock_exam_subject_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  open_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  question_limit INTEGER NOT NULL DEFAULT 100,
  completed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add session_id to mock_exam_items for specific session linking
ALTER TABLE mock_exam_items ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES mock_exam_subject_sessions(id) ON DELETE CASCADE;

-- 3. Add session_id to mock_exam_attempts to track per-session progress
ALTER TABLE mock_exam_attempts ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES mock_exam_subject_sessions(id) ON DELETE CASCADE;

-- 4. Enable RLS for mock_exam_subject_sessions
ALTER TABLE mock_exam_subject_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for mock_exam_subject_sessions
CREATE POLICY "Everyone can view sessions" ON mock_exam_subject_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage sessions" ON mock_exam_subject_sessions
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'faculty' OR profiles.role = 'admin')
    )
  );

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mock_exam_subject_sessions;
