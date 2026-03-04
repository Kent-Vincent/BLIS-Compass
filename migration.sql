
-- A) mock_exams table
CREATE TABLE IF NOT EXISTS mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_items INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- B) mock_exam_items table
CREATE TABLE IF NOT EXISTS mock_exam_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
  item_no INTEGER NOT NULL,
  question TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL, -- store 'a','b','c','d'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE mock_exams;
ALTER PUBLICATION supabase_realtime ADD TABLE mock_exam_items;

-- Enable RLS
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exam_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_exams
-- Students can select published exams
CREATE POLICY "Students can view published exams" ON mock_exams
  FOR SELECT USING (is_published = true);

-- Staff can manage their own exams
CREATE POLICY "Staff can manage their own exams" ON mock_exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'faculty' OR profiles.role = 'admin')
    )
  );

-- RLS Policies for mock_exam_items
-- Students can select items for published exams
CREATE POLICY "Students can view items for published exams" ON mock_exam_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mock_exams 
      WHERE mock_exams.id = mock_exam_items.exam_id 
      AND mock_exams.is_published = true
    )
  );

-- Staff can manage items for their own exams
CREATE POLICY "Staff can manage items for their own exams" ON mock_exam_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mock_exams 
      WHERE mock_exams.id = mock_exam_items.exam_id 
      AND mock_exams.created_by = auth.uid()
    )
  );
