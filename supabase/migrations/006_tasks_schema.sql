-- 006_tasks_schema.sql
-- Tworzy tabelę tasks (jeśli nie istnieje), backfilluje due_date dla istniejących
-- rekordów, ustawia NOT NULL, włącza RLS z polityką user widzi tylko swoje zadania.

CREATE TABLE IF NOT EXISTS tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text        NOT NULL,
  description  text,
  due_date     date,
  priority     text        NOT NULL DEFAULT 'medium',
  assigned_to  text,
  completed    boolean     NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Backfill: istniejące rekordy bez due_date dostają datę z created_at (w strefie Warsaw)
UPDATE tasks
SET due_date = (created_at AT TIME ZONE 'Europe/Warsaw')::date
WHERE due_date IS NULL;

-- Po backfillu: ustaw NOT NULL i default Warsaw dla nowych rekordów
ALTER TABLE tasks
  ALTER COLUMN due_date SET NOT NULL,
  ALTER COLUMN due_date SET DEFAULT (now() AT TIME ZONE 'Europe/Warsaw')::date;

-- Indeksy wspierające najczęstsze zapytania widgetu
CREATE INDEX IF NOT EXISTS tasks_user_due_date_idx
  ON tasks (user_id, due_date, completed);

CREATE INDEX IF NOT EXISTS tasks_user_completed_at_idx
  ON tasks (user_id, completed_at DESC)
  WHERE completed = true;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks: own'
  ) THEN
    CREATE POLICY "tasks: own" ON tasks
      FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
