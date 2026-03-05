
-- 1. Create practice_subjects table
CREATE TABLE IF NOT EXISTS practice_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create practice_questions table
CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES practice_subjects(id) ON DELETE CASCADE,
  part INTEGER NOT NULL CHECK (part BETWEEN 1 AND 5),
  question TEXT NOT NULL,
  choice_a TEXT NOT NULL,
  choice_b TEXT NOT NULL,
  choice_c TEXT NOT NULL,
  choice_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
  explanation TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_questions_subject_part ON practice_questions(subject_id, part);

-- 3. Create practice_attempts table
CREATE TABLE IF NOT EXISTS practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES practice_subjects(id) ON DELETE CASCADE,
  part INTEGER NOT NULL CHECK (part BETWEEN 1 AND 5),
  total_items INTEGER NOT NULL DEFAULT 20,
  correct_count INTEGER NOT NULL,
  score NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  attempt_no INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create practice_progress table
CREATE TABLE IF NOT EXISTS practice_progress (
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES practice_subjects(id) ON DELETE CASCADE,
  highest_unlocked_part INTEGER NOT NULL DEFAULT 1,
  best_score_part1 NUMERIC DEFAULT 0,
  best_score_part2 NUMERIC DEFAULT 0,
  best_score_part3 NUMERIC DEFAULT 0,
  best_score_part4 NUMERIC DEFAULT 0,
  best_score_part5 NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, subject_id)
);

-- 5. Enable RLS
ALTER TABLE practice_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_progress ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Subjects
CREATE POLICY "Students can view subjects" ON practice_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage subjects" ON practice_subjects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
);

-- Questions
CREATE POLICY "Staff can manage questions" ON practice_questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
);
CREATE POLICY "Students can view questions" ON practice_questions FOR SELECT TO authenticated USING (true);

-- Attempts
CREATE POLICY "Students can view own attempts" ON practice_attempts FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can insert own attempts" ON practice_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Staff can view all attempts" ON practice_attempts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
);

-- Progress
CREATE POLICY "Students can view own progress" ON practice_progress FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students can update own progress" ON practice_progress FOR UPDATE TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Staff can view all progress" ON practice_progress FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
);

-- 7. RPC Functions

-- RPC: Get questions without answers
CREATE OR REPLACE FUNCTION get_practice_questions(p_subject_id UUID, p_part INTEGER)
RETURNS TABLE (
  id UUID,
  question TEXT,
  choice_a TEXT,
  choice_b TEXT,
  choice_c TEXT,
  choice_d TEXT,
  explanation TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.question, q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.explanation
  FROM practice_questions q
  WHERE q.subject_id = p_subject_id AND q.part = p_part
  ORDER BY random()
  LIMIT 20;
END;
$$;

-- RPC: Grade attempt and update progress
CREATE OR REPLACE FUNCTION grade_practice_attempt(
  p_subject_id UUID,
  p_part INTEGER,
  p_answers JSONB -- format: {"question_id": "answer"}
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_student_id UUID := auth.uid();
  v_correct_count INTEGER := 0;
  v_total_items INTEGER := 0;
  v_score NUMERIC;
  v_passed BOOLEAN;
  v_attempt_no INTEGER;
  v_highest_unlocked INTEGER;
  v_current_best NUMERIC;
  v_q_id UUID;
  v_q_answer TEXT;
  v_student_answer TEXT;
  v_result JSONB;
BEGIN
  -- 1. Check if student is allowed to take this part
  SELECT highest_unlocked_part INTO v_highest_unlocked
  FROM practice_progress
  WHERE student_id = v_student_id AND subject_id = p_subject_id;

  IF v_highest_unlocked IS NULL THEN
    -- Initialize progress if missing
    INSERT INTO practice_progress (student_id, subject_id, highest_unlocked_part)
    VALUES (v_student_id, p_subject_id, 1);
    v_highest_unlocked := 1;
  END IF;

  IF p_part > v_highest_unlocked THEN
    RAISE EXCEPTION 'Part is locked';
  END IF;

  -- 2. Grade answers
  FOR v_q_id, v_student_answer IN SELECT * FROM jsonb_each_text(p_answers)
  LOOP
    v_total_items := v_total_items + 1;
    SELECT correct_answer INTO v_q_answer
    FROM practice_questions
    WHERE id = v_q_id;

    IF v_student_answer = v_q_answer THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  IF v_total_items = 0 THEN
    RAISE EXCEPTION 'No questions provided';
  END IF;

  v_score := (v_correct_count::NUMERIC / v_total_items::NUMERIC) * 100;
  v_passed := v_score >= 80;

  -- 3. Get attempt number
  SELECT COALESCE(MAX(attempt_no), 0) + 1 INTO v_attempt_no
  FROM practice_attempts
  WHERE student_id = v_student_id AND subject_id = p_subject_id AND part = p_part;

  -- 4. Record attempt
  INSERT INTO practice_attempts (student_id, subject_id, part, total_items, correct_count, score, passed, attempt_no)
  VALUES (v_student_id, p_subject_id, p_part, v_total_items, v_correct_count, v_score, v_passed, v_attempt_no);

  -- 5. Update progress
  IF v_passed THEN
    v_highest_unlocked := LEAST(5, GREATEST(v_highest_unlocked, p_part + 1));
  END IF;

  -- Update best score for the part
  CASE p_part
    WHEN 1 THEN
      UPDATE practice_progress SET 
        best_score_part1 = GREATEST(COALESCE(best_score_part1, 0), v_score),
        highest_unlocked_part = v_highest_unlocked,
        updated_at = now()
      WHERE student_id = v_student_id AND subject_id = p_subject_id;
    WHEN 2 THEN
      UPDATE practice_progress SET 
        best_score_part2 = GREATEST(COALESCE(best_score_part2, 0), v_score),
        highest_unlocked_part = v_highest_unlocked,
        updated_at = now()
      WHERE student_id = v_student_id AND subject_id = p_subject_id;
    WHEN 3 THEN
      UPDATE practice_progress SET 
        best_score_part3 = GREATEST(COALESCE(best_score_part3, 0), v_score),
        highest_unlocked_part = v_highest_unlocked,
        updated_at = now()
      WHERE student_id = v_student_id AND subject_id = p_subject_id;
    WHEN 4 THEN
      UPDATE practice_progress SET 
        best_score_part4 = GREATEST(COALESCE(best_score_part4, 0), v_score),
        highest_unlocked_part = v_highest_unlocked,
        updated_at = now()
      WHERE student_id = v_student_id AND subject_id = p_subject_id;
    WHEN 5 THEN
      UPDATE practice_progress SET 
        best_score_part5 = GREATEST(COALESCE(best_score_part5, 0), v_score),
        highest_unlocked_part = v_highest_unlocked,
        updated_at = now()
      WHERE student_id = v_student_id AND subject_id = p_subject_id;
  END CASE;

  v_result := jsonb_build_object(
    'score', v_score,
    'correct_count', v_correct_count,
    'total_items', v_total_items,
    'passed', v_passed,
    'next_unlocked_part', v_highest_unlocked
  );

  RETURN v_result;
END;
$$;

-- 8. Seed default subjects
INSERT INTO practice_subjects (name) VALUES 
('Library Organization & Management'),
('Reference, Bibliography & User Services'),
('Selection & Acquisition of Library Materials'),
('Cataloging & Classification'),
('Indexing & Abstracting'),
('Information Technology')
ON CONFLICT (name) DO NOTHING;
