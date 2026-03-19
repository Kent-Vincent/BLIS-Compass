-- game_progress table
CREATE TABLE IF NOT EXISTS game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  completed_levels TEXT[] DEFAULT '{}',
  last_completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_progress;

-- Enable RLS
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own game progress" ON game_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own game progress" ON game_progress
  FOR ALL USING (auth.uid() = user_id);
