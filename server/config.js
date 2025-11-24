// Конфигурация сервера
export const config = {
  // Пароль для входа в приложение (из переменной окружения или дефолт)
  PASSWORD: process.env.PASSWORD || '1221',
  
  // Секретный ключ для токенов
  SECRET_KEY: process.env.SECRET_KEY || '80-days-challenge-secret-key-2026',
  
  // Время жизни сессии (из переменной окружения или 24 часа по умолчанию)
  SESSION_DURATION: process.env.SESSION_DURATION ? parseInt(process.env.SESSION_DURATION) : 24 * 60 * 60 * 1000,
}
