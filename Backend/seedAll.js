import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns/promises';
import Category from './models/categoryModel.js';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

dns.setServers(["8.8.8.8"], ["1.1.1.1"]);
dotenv.config();
await connectDB();

const categoriesData = [
  { name: 'Grocery & Kitchen', icon: 'ShoppingBasket', color: '#FFFDD0', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&q=80' },
  { name: 'Snacks & Drinks', icon: 'Cookie', color: '#FFF0F5', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=120&q=80' },
  { name: 'Beauty & Personal Care', icon: 'Sparkles', color: '#F3E5F5', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&q=80' },
  { name: 'Fashion', icon: 'Shirt', color: '#E3F2FD', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=120&q=80' },
  { name: 'Electronics', icon: 'Laptop', color: '#E6E6FA', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=120&q=80' },
  { name: 'Mobiles', icon: 'Smartphone', color: '#E3F2FD', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=120&q=80' },
  { name: 'Furniture', icon: 'Lamp', color: '#F3E5F5', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=120&q=80' },
  { name: 'Shoes', icon: 'Footprints', color: '#FFF0F5', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&q=80' },
  { name: 'Toys', icon: 'Gamepad2', color: '#E6E6FA', image: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=120&q=80' },
];

const productsData = [
  // Grocery & Kitchen
  {
    title: 'Fresh Red Onion',
    price: 32,
    discountPrice: 28,
    originalPrice: 35,
    stock: 100,
    sku: 'GRO-ONI-001',
    category: 'Grocery & Kitchen',
    description: 'Farm-fresh premium red onions, handpicked for quality and taste.',
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80' }],
    brand: 'FreshFarm',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '1kg', color: 'Red', stock: 50, sku: 'GRO-ONI-001-1KG' },
      { size: '2kg', color: 'Red', stock: 50, sku: 'GRO-ONI-001-2KG' }
    ]
  },
  {
    title: 'Fresh Potato (Aloo)',
    price: 28,
    discountPrice: 24,
    originalPrice: 30,
    stock: 150,
    sku: 'GRO-POT-002',
    category: 'Grocery & Kitchen',
    description: 'High-quality freshly harvested potatoes suitable for everyday cooking.',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80' }],
    brand: 'FreshFarm',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '1kg', color: 'Natural', stock: 80, sku: 'GRO-POT-002-1KG' },
      { size: '5kg', color: 'Natural', stock: 70, sku: 'GRO-POT-002-5KG' }
    ]
  },
  {
    title: 'Hybrid Tomato',
    price: 45,
    discountPrice: 38,
    originalPrice: 50,
    stock: 80,
    sku: 'GRO-TOM-003',
    category: 'Grocery & Kitchen',
    description: 'Juicy, ripe and firm hybrid tomatoes packed with nutrients.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' }],
    brand: 'OrganicValley',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '500g', color: 'Red', stock: 40, sku: 'GRO-TOM-003-500G' },
      { size: '1kg', color: 'Red', stock: 40, sku: 'GRO-TOM-003-1KG' }
    ]
  },
  {
    title: 'Aashirvaad Shudh Chakki Atta',
    price: 245,
    discountPrice: 220,
    originalPrice: 260,
    stock: 60,
    sku: 'GRO-ATT-004',
    category: 'Grocery & Kitchen',
    description: '100% pure whole wheat flour processed with 4-step advantage process.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' }],
    brand: 'Aashirvaad',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '5kg', color: 'Natural', stock: 35, sku: 'GRO-ATT-004-5KG' },
      { size: '10kg', color: 'Natural', stock: 25, sku: 'GRO-ATT-004-10KG' }
    ]
  },
  {
    title: 'Fortune Premium Basmati Rice',
    price: 135,
    discountPrice: 119,
    originalPrice: 150,
    stock: 75,
    sku: 'GRO-RIC-005',
    category: 'Grocery & Kitchen',
    description: 'Long grain fragrant basmati rice ideal for biryani and pulao.',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' }],
    brand: 'Fortune',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '1kg', color: 'White', stock: 45, sku: 'GRO-RIC-005-1KG' },
      { size: '5kg', color: 'White', stock: 30, sku: 'GRO-RIC-005-5KG' }
    ]
  },

  // Snacks & Drinks
  {
    title: "Lay's India's Magic Masala",
    price: 20,
    discountPrice: 18,
    originalPrice: 20,
    stock: 200,
    sku: 'SNK-LAY-001',
    category: 'Snacks & Drinks',
    description: 'Crispy potato chips with aromatic spicy Indian blend flavors.',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80' }],
    brand: "Lay's",
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '48g', color: 'Blue', stock: 120, sku: 'SNK-LAY-001-48G' },
      { size: '90g', color: 'Blue', stock: 80, sku: 'SNK-LAY-001-90G' }
    ]
  },
  {
    title: 'Coca-Cola Soft Drink',
    price: 40,
    discountPrice: 38,
    originalPrice: 40,
    stock: 120,
    sku: 'SNK-COK-002',
    category: 'Snacks & Drinks',
    description: 'Refreshing carbonated soft drink served best chilled.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80' }],
    brand: 'Coca-Cola',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '750ml', color: 'Red', stock: 70, sku: 'SNK-COK-002-750ML' },
      { size: '1.25L', color: 'Red', stock: 50, sku: 'SNK-COK-002-1.25L' }
    ]
  },
  {
    title: 'Cadbury Dairy Milk Silk',
    price: 80,
    discountPrice: 75,
    originalPrice: 85,
    stock: 90,
    sku: 'SNK-CAD-003',
    category: 'Snacks & Drinks',
    description: 'Creamy and smooth milk chocolate that melts in your mouth.',
    image: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?w=400&q=80' }],
    brand: 'Cadbury',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '60g', color: 'Purple', stock: 50, sku: 'SNK-CAD-003-60G' },
      { size: '150g', color: 'Purple', stock: 40, sku: 'SNK-CAD-003-150G' }
    ]
  },

  // Beauty & Personal Care
  {
    title: 'Nivea Soft Light Moisturizer Cream',
    price: 299,
    discountPrice: 249,
    originalPrice: 320,
    stock: 65,
    sku: 'BTY-NIV-001',
    category: 'Beauty & Personal Care',
    description: 'Non-greasy light moisturizing cream with Jojoba oil & Vitamin E.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' }],
    brand: 'Nivea',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '200ml', color: 'White', stock: 65, sku: 'BTY-NIV-001-200ML' }
    ]
  },
  {
    title: "L'Oreal Paris Total Repair 5 Shampoo",
    price: 349,
    discountPrice: 299,
    originalPrice: 380,
    stock: 50,
    sku: 'BTY-LOR-002',
    category: 'Beauty & Personal Care',
    description: 'Expert damage repair shampoo enriched with Keratin XS.',
    image: 'https://images.unsplash.com/photo-1527799851257-359321b38524?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1527799851257-359321b38524?w=400&q=80' }],
    brand: "L'Oreal",
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '340ml', color: 'White', stock: 50, sku: 'BTY-LOR-002-340ML' }
    ]
  },

  // Fashion
  {
    title: 'Casual Summer T-Shirt',
    price: 599,
    discountPrice: 449,
    originalPrice: 699,
    stock: 75,
    sku: 'FAS-TSH-001',
    category: 'Fashion',
    description: 'Premium breathable cotton t-shirt with modern styling.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' }],
    brand: 'UrbanStyle',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'M', color: 'White', stock: 25, sku: 'FAS-TSH-001-M-WHT' },
      { size: 'L', color: 'White', stock: 25, sku: 'FAS-TSH-001-L-WHT' },
      { size: 'M', color: 'Black', stock: 25, sku: 'FAS-TSH-001-M-BLK' }
    ]
  },
  {
    title: 'Slim Fit Denim Jeans',
    price: 1799,
    discountPrice: 1399,
    originalPrice: 1999,
    stock: 45,
    sku: 'FAS-JNS-002',
    category: 'Fashion',
    description: 'Stretchable comfortable slim-fit indigo jeans.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80' }],
    brand: 'DenimCo',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '32', color: 'Blue', stock: 25, sku: 'FAS-JNS-002-32' },
      { size: '34', color: 'Blue', stock: 20, sku: 'FAS-JNS-002-34' }
    ]
  },

  // Electronics
  {
    title: 'boAt Airdopes Bluetooth Earbuds',
    price: 1299,
    discountPrice: 999,
    originalPrice: 2490,
    stock: 60,
    sku: 'ELE-BOT-001',
    category: 'Electronics',
    description: 'Wireless earbuds with Beast Mode low latency and ASAP charge.',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80' }],
    brand: 'boAt',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'One Size', color: 'Active Black', stock: 35, sku: 'ELE-BOT-001-BLK' },
      { size: 'One Size', color: 'Bold Blue', stock: 25, sku: 'ELE-BOT-001-BLU' }
    ]
  },

  // Mobiles
  {
    title: 'Redmi Note 13 Pro 5G',
    price: 19999,
    discountPrice: 18499,
    originalPrice: 21999,
    stock: 25,
    sku: 'MOB-RED-001',
    category: 'Mobiles',
    description: '200MP camera, 1.5K AMOLED Display, 67W Turbo Charge smartphone.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' }],
    brand: 'Redmi',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '8GB+128GB', color: 'Midnight Black', stock: 15, sku: 'MOB-RED-001-BLK' },
      { size: '12GB+256GB', color: 'Ocean Teal', stock: 10, sku: 'MOB-RED-001-BLU' }
    ]
  },

  // Furniture
  {
    title: 'Wooden Laptop Study Table',
    price: 1499,
    discountPrice: 1199,
    originalPrice: 1999,
    stock: 30,
    sku: 'FUR-TAB-001',
    category: 'Furniture',
    description: 'Foldable ergonomic wooden laptop bed desk with cup holder.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400&q=80' }],
    brand: 'UrbanCraft',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'Standard', color: 'Walnut Brown', stock: 30, sku: 'FUR-TAB-001-BRN' }
    ]
  },

  // Shoes
  {
    title: 'Sports Running Shoes',
    price: 1899,
    discountPrice: 1499,
    originalPrice: 2499,
    stock: 40,
    sku: 'SHO-RUN-001',
    category: 'Shoes',
    description: 'Breathable lightweight cushioned sports sneakers for workouts.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' }],
    brand: 'SprintX',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'UK 7', color: 'Red/Black', stock: 10, sku: 'SHO-RUN-001-7' },
      { size: 'UK 8', color: 'Red/Black', stock: 15, sku: 'SHO-RUN-001-8' },
      { size: 'UK 9', color: 'Red/Black', stock: 15, sku: 'SHO-RUN-001-9' }
    ]
  },

  // Toys
  {
    title: 'Soft Plush Teddy Bear',
    price: 499,
    discountPrice: 399,
    originalPrice: 599,
    stock: 55,
    sku: 'TOY-TED-001',
    category: 'Toys',
    description: 'Super soft, huggable and safe premium quality stuffed plush toy.',
    image: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=400&q=80',
    images: [{ url: 'https://images.unsplash.com/photo-1559251606-c623743a6d76?w=400&q=80' }],
    brand: 'PlayTime',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '30cm', color: 'Brown', stock: 30, sku: 'TOY-TED-001-BRN' },
      { size: '45cm', color: 'Pink', stock: 25, sku: 'TOY-TED-001-PNK' }
    ]
  }
];

const seedAll = async () => {
  try {
    console.log('🔄 Cleaning old Categories and Products...');
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log('🌱 Seeding Categories...');
    const createdCategories = await Category.insertMany(categoriesData);
    console.log(`✅ ${createdCategories.length} Categories seeded!`);

    console.log('🌱 Seeding Products...');
    const createdProducts = await Product.insertMany(productsData);
    console.log(`✅ ${createdProducts.length} Products seeded across all categories!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAll();
