// Единственное место, где перечислены все настраиваемые через админку ключи интеграций.
export const SETTING_KEYS = [
  'YOOKASSA_SHOP_ID',
  'YOOKASSA_SECRET_KEY',
  'PLANT_ID_API_KEY',
  'LLM_API_KEY',
  'LLM_API_URL',
  'LLM_MODEL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'SMTP_SECURE',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];
