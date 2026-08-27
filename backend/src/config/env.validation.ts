// Падаем на старте, а не тихо работаем на небезопасных дефолтах (например JWT_SECRET),
// если критичная переменная окружения не задана — это дешевле, чем разбираться в проде.
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL'] as const;

export function validateRequiredEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Отсутствуют обязательные переменные окружения: ${missing.join(', ')}. ` +
        'Заполните их в .env (см. .env.example) перед запуском.',
    );
  }

  if (process.env.JWT_SECRET === 'change-me-in-production') {
    throw new Error(
      'JWT_SECRET установлен в значение по умолчанию из .env.example. Задайте уникальный секрет перед запуском.',
    );
  }
}
