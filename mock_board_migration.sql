-- Migration for Mock Board Exam features

-- 1. Add exam_type to mock_exams (if not already added by previous step)
ALTER TABLE mock_exams ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'regular';

-- 2. Add subject_id to mock_exam_items
ALTER TABLE mock_exam_items ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES practice_subjects(id);

-- 3. Create mock_exam_attempts table for resumable sessions and results
CREATE TABLE IF NOT EXISTS mock_exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  flagged JSONB DEFAULT '{}',
  time_left_seconds INTEGER NOT NULL,
  current_index INTEGER DEFAULT 0,
  is_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS for mock_exam_attempts
ALTER TABLE mock_exam_attempts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for mock_exam_attempts
CREATE POLICY "Students can manage their own attempts" ON mock_exam_attempts
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Staff can view all attempts" ON mock_exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'faculty' OR profiles.role = 'admin')
    )
  );

-- 6. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mock_exam_attempts;
