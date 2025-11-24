-- Схема базы данных для 80 Days Challenge

-- Таблица для задач в клеточках
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_number VARCHAR(10) UNIQUE NOT NULL,
  tasks JSONB NOT NULL DEFAULT '{"todo": [], "done": [], "not-done": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по cell_number
CREATE INDEX IF NOT EXISTS idx_tasks_cell_number ON tasks(cell_number);

-- Таблица для завершенных дней
CREATE TABLE IF NOT EXISTS completed_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER UNIQUE NOT NULL,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по day_number
CREATE INDEX IF NOT EXISTS idx_completed_days_day_number ON completed_days(day_number);

-- Таблица для финансов (один документ)
CREATE TABLE IF NOT EXISTS finances (
  id INTEGER PRIMARY KEY DEFAULT 1,
  capital NUMERIC(12, 2) DEFAULT 0,
  expenses JSONB NOT NULL DEFAULT '{"Октябрь": [], "Ноябрь": [], "Декабрь": [], "Январь": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_finance_record CHECK (id = 1)
);

-- Таблица для целей (один документ)
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY DEFAULT 1,
  goals JSONB NOT NULL DEFAULT '{"planned": [], "completed": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_goal_record CHECK (id = 1)
);

-- Таблица для сессий авторизации
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  expires BIGINT NOT NULL,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::bigint * 1000
);

-- Индекс для быстрого поиска по token
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Индекс для автоматического удаления истекших сессий
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_completed_days_updated_at BEFORE UPDATE ON completed_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finances_updated_at BEFORE UPDATE ON finances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Отключаем Row Level Security для всех таблиц (у нас своя система авторизации)
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE completed_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE finances DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;

