import prisma from '../src/lib/prisma';
import { INITIAL_BANNERS, INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../src/lib/data';
import { STORE_LOCATION } from '../src/lib/constants';

async function main() {
  console.log('Seeding 7Cheese Pizza database with all 7 categories and menu items...');

  // Clear existing records
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.banner.deleteMany();

  // 1. Create Banners
  for (const banner of INITIAL_BANNERS) {
    await prisma.banner.create({
      data: {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        tag: banner.tag,
        badge: banner.badge,
        imageUrl: banner.imageUrl,
        active: true,
      },
    });
  }

  // 2. Create Categories
  const categoryMap = new Map<string, string>();
  for (const cat of INITIAL_CATEGORIES) {
    const createdCat = await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
    categoryMap.set(cat.slug, createdCat.id);
  }

  // 3. Create Products
  for (const prod of INITIAL_PRODUCTS) {
    const categoryId = categoryMap.get(prod.categorySlug);
    if (!categoryId) continue;

    await prisma.product.create({
      data: {
        id: prod.id,
        name: prod.name,
        description: prod.description,
        price: prod.price,
        image: prod.image,
        isVeg: prod.isVeg,
        badge: prod.badge || null,
        categoryId: categoryId,
      },
    });
  }

  // 4. Seed sample initial orders for Admin display
  const sampleProduct = await prisma.product.findFirst({ where: { name: 'Peppy Paneer' } });
  const sampleBread = await prisma.product.findFirst({ where: { name: 'Garlic Bread (Veg)' } });
  const sampleNonVeg = await prisma.product.findFirst({ where: { name: 'Chicken Supremo' } });

  if (sampleProduct && sampleBread) {
    await prisma.order.create({
      data: {
        id: 'ORD-70192',
        customerName: 'Aarav Sharma',
        customerPhone: '+91 98765 43210',
        deliveryAddress: 'Flat 402, Green Valley Apartments, Kaladhungi Road, Haldwani',
        deliveryType: 'Delivery',
        totalAmount: 437,
        status: 'Preparing',
        items: {
          create: [
            {
              productId: sampleProduct.id,
              name: sampleProduct.name,
              size: 'Regular',
              crust: 'Cheese Burst',
              quantity: 1,
              price: 279,
            },
            {
              productId: sampleBread.id,
              name: sampleBread.name,
              size: 'Standard',
              crust: 'Classic Hand Tossed',
              quantity: 2,
              price: 158,
            },
          ],
        },
      },
    });
  }

  if (sampleNonVeg) {
    await prisma.order.create({
      data: {
        id: 'ORD-70193',
        customerName: 'Priya Patel',
        customerPhone: '+91 91234 56789',
        deliveryAddress: 'Table #04 (Dine-in Table Order)',
        deliveryType: 'Dine-in',
        totalAmount: 648,
        status: 'Pending',
        items: {
          create: [
            {
              productId: sampleNonVeg.id,
              name: sampleNonVeg.name,
              size: 'Medium',
              crust: 'Cheese Burst',
              quantity: 1,
              price: 529,
            },
          ],
        },
      },
    });
  }

  console.log(`Seeding complete: ${INITIAL_CATEGORIES.length} categories, ${INITIAL_PRODUCTS.length} products seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
