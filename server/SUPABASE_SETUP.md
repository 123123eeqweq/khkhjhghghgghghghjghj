# Настройка Supabase

## 1. Создание таблиц в Supabase

Откройте **Supabase Dashboard** → **SQL Editor** и выполните следующие команды:

```sql
-- Скопируйте и вставьте весь файл schema.sql
```

Или выполните команды из файла `schema.sql` по порядку.

## 2. Получение данных для подключения

1. Откройте **Supabase Dashboard** → **Settings** → **API**
2. Найдите:
   - **Project URL** (например: `https://xxxxx.supabase.co`)
   - **service_role key** (под секцией "Project API keys", выберите `service_role` secret)

## 3. Настройка переменных окружения

Отредактируйте файл `server/supabase.js` и замените:
- `YOUR_SUPABASE_URL` на ваш Project URL
- `YOUR_SUPABASE_SERVICE_ROLE_KEY` на ваш service_role key

Или создайте файл `.env` в папке `server/`:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 4. Запуск сервера

```bash
cd server
npm start
```

Готово! 🎉

