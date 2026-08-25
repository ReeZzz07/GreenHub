import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Слаги соответствуют значениям Plant.category в моковых данных фронтенда
const categories = [
  { name: 'Комнатные', slug: 'indoor', icon: '🏠' },
  { name: 'Садовые', slug: 'outdoor', icon: '🌳' },
  { name: 'Суккуленты', slug: 'succulents', icon: '🌵' },
  { name: 'Цветы', slug: 'flowers', icon: '🌸' },
  { name: 'Деревья', slug: 'trees', icon: '🌲' },
  { name: 'Травы', slug: 'herbs', icon: '🌿' },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon },
      create: category,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
