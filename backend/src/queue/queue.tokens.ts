// Имена очередей BullMQ (TZ.md 2.2: "BullMQ + Redis для фоновых задач — ИИ-обработка,
// генерация вотермарков, отправка email/push"). Воркеры сейчас работают в том же процессе,
// что и API (см. комментарии у воркеров) — это по-прежнему настоящая асинхронная обработка через
// Redis-очередь (с ретраями/бэкоффом), просто без отдельного deploy-таргета под воркер; вынести
// воркер в отдельный процесс можно позже без изменения бизнес-логики.
export const AI_RECOGNIZE_QUEUE = 'ai-recognize';
export const AI_DESCRIPTION_QUEUE = 'ai-description';
export const IMAGE_WATERMARK_QUEUE = 'image-watermark';
export const EMAIL_QUEUE = 'email';
