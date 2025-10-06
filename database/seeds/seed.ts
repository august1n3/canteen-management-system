import { 
  PrismaClient, 
  UserRole, 
  UserStatus, 
  MenuItemCategory, 
  MenuItemStatus, 
  DietaryRestriction, 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod,
} from '@prisma/client';

const prisma = new PrismaClient();

// Disable foreign key checks for clean up
async function disableForeignKeyChecks() {
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
}

// Enable foreign key checks after clean up
async function enableForeignKeyChecks() {
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
}

async function main() {
  // Clean up existing data
  await prisma.$transaction([
    prisma.systemLog.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@canteen.com',
      password: '$2a$12$u0WE7PNSa..1hviyqOBqmOlwEjgUpeoJZVIX9PCLN0s6cT4u51POu', // password123
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Create staff users
  const staff = await prisma.user.create({
    data: {
      email: 'staff@canteen.com',
      password: '$2a$12$u0WE7PNSa..1hviyqOBqmOlwEjgUpeoJZVIX9PCLN0s6cT4u51POu',
      firstName: 'Staff',
      lastName: 'Member',
      role: UserRole.CANTEEN_STAFF,
      status: UserStatus.ACTIVE,
    },
  });

  // Create student users
  const student = await prisma.user.create({
    data: {
      email: 'student@university.com',
      password: '$2a$12$u0WE7PNSa..1hviyqOBqmOlwEjgUpeoJZVIX9PCLN0s6cT4u51POu',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      studentId: 'STU001',
      phoneNumber: '+255123456789',
    },
  });

  // Create menu items - Tanzanian/Swahili Cuisine
  const menuItems = await Promise.all([
    // Main Courses
    prisma.menuItem.create({
      data: {
        name: 'Pilau',
        description: 'Spiced rice cooked with meat, served with kachumbari',
        price: 8000, // TZS
        category: MenuItemCategory.MAIN_COURSE,
        status: MenuItemStatus.AVAILABLE,
        imageUrl: 'https://example.com/images/pilau.jpg',
        preparationTime: 20,
        ingredients: ['Rice', 'Beef', 'Pilau masala', 'Onions', 'Garlic', 'Ginger'],
        allergens: ['None'],
        dietaryRestrictions: [],
        stockQuantity: 50,
        isSpicy: true,
        isPopular: true,
        calories: 450,
        protein: 25.5,
        carbohydrates: 65.3,
        fat: 12.1,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Nyama Choma',
        description: 'Grilled meat (goat/beef) served with ugali and sukuma wiki',
        price: 12000,
        category: MenuItemCategory.MAIN_COURSE,
        status: MenuItemStatus.AVAILABLE,
        imageUrl: 'https://example.com/images/nyama-choma.jpg',
        preparationTime: 30,
        ingredients: ['Goat meat/Beef', 'Maize flour', 'Collard greens', 'Spices'],
        allergens: ['None'],
        dietaryRestrictions: [],
        stockQuantity: 30,
        isSpicy: false,
        isPopular: true,
        calories: 650,
        protein: 45.0,
        carbohydrates: 55.0,
        fat: 25.0,
      },
    }),

    // Appetizers
    prisma.menuItem.create({
      data: {
        name: 'Mandazi',
        description: 'East African doughnuts lightly spiced with cardamom',
        price: 500,
        category: MenuItemCategory.APPETIZER,
        status: MenuItemStatus.AVAILABLE,
        imageUrl: 'https://example.com/images/mandazi.jpg',
        preparationTime: 15,
        ingredients: ['Flour', 'Sugar', 'Cardamom', 'Milk', 'Eggs'],
        allergens: ['Eggs', 'Dairy', 'Gluten'],
        dietaryRestrictions: [],
        stockQuantity: 100,
        isSpicy: false,
        isPopular: true,
        calories: 150,
        protein: 3.0,
        carbohydrates: 25.0,
        fat: 5.0,
      },
    }),

    // Beverages
    prisma.menuItem.create({
      data: {
        name: 'Tangawizi',
        description: 'Traditional ginger tea',
        price: 1000,
        category: MenuItemCategory.BEVERAGE,
        status: MenuItemStatus.AVAILABLE,
        imageUrl: 'https://example.com/images/tangawizi.jpg',
        preparationTime: 10,
        ingredients: ['Ginger', 'Tea leaves', 'Sugar', 'Milk'],
        allergens: ['Dairy'],
        dietaryRestrictions: [],
        stockQuantity: 80,
        isSpicy: true,
        isPopular: false,
        calories: 80,
        protein: 1.0,
        carbohydrates: 15.0,
        fat: 2.5,
      },
    }),

    // Side Dishes
    prisma.menuItem.create({
      data: {
        name: 'Maharage ya Nazi',
        description: 'Beans cooked in coconut sauce',
        price: 4000,
        category: MenuItemCategory.SIDE_DISH,
        status: MenuItemStatus.AVAILABLE,
        imageUrl: 'https://example.com/images/maharage.jpg',
        preparationTime: 25,
        ingredients: ['Beans', 'Coconut milk', 'Onions', 'Tomatoes', 'Spices'],
        allergens: ['Coconut'],
        dietaryRestrictions: [DietaryRestriction.VEGETARIAN, DietaryRestriction.VEGAN],
        stockQuantity: 40,
        isSpicy: false,
        isPopular: true,
        calories: 300,
        protein: 12.0,
        carbohydrates: 45.0,
        fat: 8.0,
      },
    }),
  ]);

  // Create a sample order
  const order = await prisma.order.create({
    data: {
      userId: student.id,
      orderNumber: 'ORD-20251005-001',
      totalAmount: 20500, // Pilau + Maharage + Tangawizi
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      specialInstructions: 'Extra kachumbari please',
      items: {
        create: [
          {
              menuItemId: menuItems[0].id, // Pilau
              quantity: 2,
              price: 8000,
              specialInstructions: 'Extra spicy',
            },
            {
              menuItemId: menuItems[4].id, // Maharage ya Nazi
              quantity: 1,
              price: 4000,
            },
            {
              menuItemId: menuItems[3].id, // Tangawizi
              quantity: 1,
              price: 1000,
            },
        ],
      },
      payments: {
        create: [{
          amount: 20500,
          method: PaymentMethod.MOBILE_MONEY,
          status: PaymentStatus.COMPLETED,
          transactionId: 'TXN-20251005-001',
          userId: student.id,
        }],
      },
    },
  });

  // Create system logs
  // Create initial system logs
  await Promise.all([
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        userId: admin.id,
        message: 'USER_REGISTERED',
        context: {
          userId: student.id,
          email: student.email,
        },
      },
    }),
    prisma.systemLog.create({
      data: {
        level: 'INFO',
        userId: student.id,
        message: 'ORDER_CREATED',
        context: {
          orderId: order.id,
          totalAmount: order.totalAmount,
        },
      },
    }),
  ]);

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });