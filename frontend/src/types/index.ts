// Цветовая палитра
export const colors = {
  primary: '#2d6a4f',
  primaryLight: '#52b788',
  primaryDark: '#1b4332',
  secondary: '#d8f3dc',
  accent: '#95d5b2',
  earth: '#bc6c25',
  sand: '#fefae0',
  text: '#1d3557',
  textLight: '#6c757d',
  background: '#f8f9fa',
  white: '#ffffff',
  error: '#e63946',
  success: '#2a9d8f',
  warning: '#ffb703',
};

// Размеры для адаптивности
export const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

// Типы пользователей
export enum UserRole {
  GUEST = 'guest',
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
  BOTANIST = 'botanist',
}

// Статусы заказа
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// Категории растений
export const plantCategories = [
  { id: 'indoor', name: 'Комнатные', icon: '🏠' },
  { id: 'outdoor', name: 'Садовые', icon: '🌳' },
  { id: 'succulents', name: 'Суккуленты', icon: '🌵' },
  { id: 'flowers', name: 'Цветы', icon: '🌸' },
  { id: 'trees', name: 'Деревья', icon: '🌲' },
  { id: 'herbs', name: 'Травы', icon: '🌿' },
];

// Навигационные элементы
export const navigationItems = [
  { path: '/', label: 'Главная', icon: 'home' },
  { path: '/catalog', label: 'Каталог', icon: 'grid' },
  { path: '/recognize', label: 'Распознать', icon: 'camera' },
  { path: '/cart', label: 'Корзина', icon: 'shopping-cart' },
  { path: '/profile', label: 'Профиль', icon: 'user' },
];
