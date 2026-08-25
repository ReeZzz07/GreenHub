import React from 'react';
import { Link } from 'react-router-dom';
import { LeafIcon, StarIcon, ArrowLeftIcon } from '../components/Icons';
import { Plant } from '../types/models';

// Моковые данные для растений
const mockPlants: Plant[] = [
  {
    id: '1',
    name: 'Монстера Делициоза',
    latinName: 'Monstera deliciosa',
    description: 'Эффектное тропическое растение с крупными резными листьями. Идеально подходит для создания зеленого уголка в интерьере.',
    price: 2500,
    images: ['https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500'],
    category: 'indoor',
    sellerId: 's1',
    sellerName: 'GreenShop',
    inStock: true,
    quantity: 15,
    rating: 4.8,
    reviewsCount: 124,
    aiGenerated: false,
    careInstructions: ['Яркий рассеянный свет', 'Полив 2-3 раза в неделю', 'Высокая влажность'],
    lightRequirements: 'Яркий рассеянный свет',
    waterRequirements: 'Умеренный полив',
    difficulty: 'easy',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Фикус Лирата',
    latinName: 'Ficus lyrata',
    description: 'Элегантное дерево с крупными листьями в форме скрипки. Станет отличным акцентом в просторном помещении.',
    price: 4500,
    images: ['https://images.unsplash.com/photo-1612361668944-5871a5f07411?w=500'],
    category: 'indoor',
    sellerId: 's2',
    sellerName: 'PlantHome',
    inStock: true,
    quantity: 8,
    rating: 4.6,
    reviewsCount: 89,
    aiGenerated: false,
    careInstructions: ['Яркий свет', 'Полив раз в неделю', 'Протирать листья'],
    lightRequirements: 'Яркий свет',
    waterRequirements: 'Умеренный полив',
    difficulty: 'medium',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Сансевиерия',
    latinName: 'Sansevieria trifasciata',
    description: 'Неприхотливое растение с вертикальными мечевидными листьями. Очищает воздух и не требует частого полива.',
    price: 1200,
    images: ['https://images.unsplash.com/photo-1599598425947-d352e0a6e0a7?w=500'],
    category: 'succulents',
    sellerId: 's1',
    sellerName: 'GreenShop',
    inStock: true,
    quantity: 25,
    rating: 4.9,
    reviewsCount: 201,
    aiGenerated: false,
    careInstructions: ['Любой свет', 'Полив раз в 2-3 недели', 'Не требовательна'],
    lightRequirements: 'Любой свет',
    waterRequirements: 'Редкий полив',
    difficulty: 'easy',
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Калатея Орната',
    latinName: 'Calathea ornata',
    description: 'Декоративнолиственное растение с удивительным узором на листьях. Требует внимания, но вознаграждает красотой.',
    price: 1800,
    images: ['https://images.unsplash.com/photo-1628151016024-5d510f69626e?w=500'],
    category: 'indoor',
    sellerId: 's3',
    sellerName: 'TropicalGarden',
    inStock: true,
    quantity: 12,
    rating: 4.5,
    reviewsCount: 67,
    aiGenerated: false,
    careInstructions: ['Рассеянный свет', 'Частый полив', 'Высокая влажность'],
    lightRequirements: 'Рассеянный свет',
    waterRequirements: 'Частый полив',
    difficulty: 'hard',
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'Эхеверия',
    latinName: 'Echeveria elegans',
    description: 'Миниатюрный суккулент с розеткой мясистых листьев голубовато-зеленого цвета. Идеален для композиций.',
    price: 450,
    images: ['https://images.unsplash.com/photo-1459411552884-841f9436f384?w=500'],
    category: 'succulents',
    sellerId: 's2',
    sellerName: 'PlantHome',
    inStock: true,
    quantity: 50,
    rating: 4.7,
    reviewsCount: 156,
    aiGenerated: false,
    careInstructions: ['Яркий свет', 'Редкий полив', 'Хороший дренаж'],
    lightRequirements: 'Яркий свет',
    waterRequirements: 'Редкий полив',
    difficulty: 'easy',
    createdAt: new Date(),
  },
  {
    id: '6',
    name: 'Папоротник Нефролепис',
    latinName: 'Nephrolepis exaltata',
    description: 'Классический папоротник с пышной ажурной листвой. Создает уютную атмосферу в любом помещении.',
    price: 950,
    images: ['https://images.unsplash.com/photo-1596541673894-1b9d1f89d2e6?w=500'],
    category: 'indoor',
    sellerId: 's1',
    sellerName: 'GreenShop',
    inStock: false,
    quantity: 0,
    rating: 4.4,
    reviewsCount: 93,
    aiGenerated: false,
    careInstructions: ['Рассеянный свет', 'Частый полив', 'Опрыскивание'],
    lightRequirements: 'Рассеянный свет',
    waterRequirements: 'Частый полив',
    difficulty: 'medium',
    createdAt: new Date(),
  },
];

interface HomePageProps {
  // props
}

const HomePage: React.FC<HomePageProps> = () => {
  const featuredPlants = mockPlants.slice(0, 4);
  const easyCarePlants = mockPlants.filter(p => p.difficulty === 'easy').slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative h-64 overflow-hidden gradient-nature">
        <div className="absolute inset-0 opacity-20 leaf-pattern"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <LeafIcon size={64} className="text-white mb-4 animate-pulse-soft" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Добро пожаловать в GreenHub
          </h1>
          <p className="text-green-100 text-sm max-w-xs">
            Ваш персональный помощник в мире растений
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/recognize"
            className="card p-4 text-center hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Распознать растение</h3>
            <p className="text-xs text-gray-500 mt-1">AI-помощник</p>
          </Link>
          <Link
            to="/catalog"
            className="card p-4 text-center hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800">Каталог</h3>
            <p className="text-xs text-gray-500 mt-1">{mockPlants.length} растений</p>
          </Link>
        </div>
      </section>

      {/* Featured Plants */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Популярные растения</h2>
          <Link to="/catalog" className="text-green-600 text-sm font-medium hover:text-green-700">
            Все →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {featuredPlants.map((plant) => (
            <Link key={plant.id} to={`/plant/${plant.id}`} className="block">
              <div className="card card-hover overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 relative">
                  <img
                    src={plant.images[0]}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {!plant.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                        Нет в наличии
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm truncate">{plant.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <StarIcon size={12} filled className="text-amber-400" />
                    <span className="text-xs text-gray-600">{plant.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-green-700 font-bold text-sm mt-2">
                    {plant.price.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Easy Care Section */}
      <section className="px-4 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Для начинающих</h2>
        <div className="space-y-3">
          {easyCarePlants.map((plant) => (
            <Link key={plant.id} to={`/plant/${plant.id}`} className="block">
              <div className="card p-3 flex gap-3 hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={plant.images[0]}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{plant.name}</h3>
                  <p className="text-xs text-gray-500 italic truncate">{plant.latinName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-success text-xs">Легко</span>
                    <span className="text-green-700 font-bold text-sm">
                      {plant.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-6">
        <div className="gradient-sand rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Почему GreenHub?</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">AI-распознавание</h3>
                <p className="text-sm text-gray-600">Определите название растения по фото за секунды</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Удобная оплата</h3>
                <p className="text-sm text-gray-600">Оплачивайте заказами через платежные ссылки</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Проверенные продавцы</h3>
                <p className="text-sm text-gray-600">Только качественные растения от надежных поставщиков</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
