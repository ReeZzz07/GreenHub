import type { HomePageContent } from './api';

// Совпадает с DEFAULT_HOME_CONTENT на бэкенде (backend/src/home-content/home-content.service.ts) —
// используется как запасной вариант, если API контента главной недоступен, и как заготовка для формы редактирования.
export const DEFAULT_HOME_CONTENT: HomePageContent = {
  heroBanner: {
    title: 'Растения от продавцов напрямую',
    ctaText: 'Смотреть каталог',
  },
  recognizeBanner: {
    badgeText: 'AI-распознавание',
    title: 'Не знаете это растение?',
    description: 'Сфотографируйте — определим вид за секунды и подберём похожие в каталоге',
    ctaText: 'Распознать',
  },
  featuresTitle: 'Почему GreenHub?',
  features: [
    {
      title: 'Растения с инструкцией по уходу',
      description: 'У каждого товара — рекомендации по поливу и освещению',
      icon: 'droplet',
      iconType: 'PRESET',
    },
    {
      title: 'Удобная оплата',
      description: 'Оплачивайте заказами через платежные ссылки',
      icon: 'wallet',
      iconType: 'PRESET',
    },
    {
      title: 'Проверенные продавцы',
      description: 'Рейтинг и отзывы покупателей у каждого продавца',
      icon: 'star',
      iconType: 'PRESET',
    },
  ],
  howItWorksTitle: 'Как это работает',
  steps: [
    { title: 'Найдите растение', description: 'Ищите в каталоге по названию или фильтрам — либо сфотографируйте' },
    { title: 'Напишите продавцу', description: 'Уточните детали напрямую в чате внутри платформы' },
    { title: 'Купите напрямую', description: 'Оплата по безопасной ссылке, без посредников' },
  ],
  newArrivalsTitle: 'Новые поступления',
  closingCta: {
    title: 'Продаёте растения?',
    description: 'Разместите объявление бесплатно — оно появится в каталоге сразу после проверки',
    buttonText: 'Разместить объявление',
  },
};
