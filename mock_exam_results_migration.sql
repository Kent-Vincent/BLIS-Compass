
-- Create mock_exam_results table for final exam scores and analytics
CREATE TABLE IF NOT EXISTS mock_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_items INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  category_breakdown JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own results" ON mock_exam_results
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Staff can view all results" ON mock_exam_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'faculty' OR profiles.role = 'admin')
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE mock_exam_results;
