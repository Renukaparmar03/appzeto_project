import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'node:dns/promises';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

dns.setServers(["8.8.8.8"], ["1.1.1.1"]);
dotenv.config();
await connectDB();

const products = [
  {
    title: 'Classic White T-Shirt',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' }],
    category: 'Clothing',
    description: 'Premium cotton white t-shirt, comfortable and breathable for everyday wear.',
    price: 599,
    discountPrice: 449,
    originalPrice: 599,
    stock: 50,
    sku: 'TSH-WHT-001',
    brand: 'UrbanStyle',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'S', color: 'White', stock: 10, sku: 'TSH-WHT-001-S' },
      { size: 'M', color: 'White', stock: 15, sku: 'TSH-WHT-001-M' },
      { size: 'L', color: 'White', stock: 15, sku: 'TSH-WHT-001-L' },
      { size: 'XL', color: 'White', stock: 10, sku: 'TSH-WHT-001-XL' },
    ]
  },
  {
    title: 'Black Hoodie',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400' }],
    category: 'Clothing',
    description: 'Warm fleece-lined black hoodie with front pocket and adjustable drawstring.',
    price: 1299,
    discountPrice: 999,
    originalPrice: 1299,
    stock: 30,
    sku: 'HOD-BLK-002',
    brand: 'StreetWear',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'M', color: 'Black', stock: 10, sku: 'HOD-BLK-002-M' },
      { size: 'L', color: 'Black', stock: 10, sku: 'HOD-BLK-002-L' },
      { size: 'XL', color: 'Black', stock: 10, sku: 'HOD-BLK-002-XL' },
    ]
  },
  {
    title: 'Running Shoes - Blue',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' }],
    category: 'Footwear',
    description: 'Lightweight running shoes with cushioned sole for maximum comfort during workouts.',
    price: 2499,
    discountPrice: 1899,
    originalPrice: 2499,
    stock: 25,
    sku: 'SHO-BLU-003',
    brand: 'SprintX',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '7', color: 'Blue', stock: 5, sku: 'SHO-BLU-003-7' },
      { size: '8', color: 'Blue', stock: 8, sku: 'SHO-BLU-003-8' },
      { size: '9', color: 'Blue', stock: 7, sku: 'SHO-BLU-003-9' },
      { size: '10', color: 'Blue', stock: 5, sku: 'SHO-BLU-003-10' },
    ]
  },
  {
    title: 'Wireless Earbuds Pro',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400' }],
    category: 'Electronics',
    description: 'True wireless earbuds with active noise cancellation and 30-hour battery life.',
    price: 3999,
    discountPrice: 2999,
    originalPrice: 3999,
    stock: 40,
    sku: 'EAR-BLK-004',
    brand: 'SoundMax',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'One Size', color: 'Black', stock: 20, sku: 'EAR-BLK-004-BLK' },
      { size: 'One Size', color: 'White', stock: 20, sku: 'EAR-BLK-004-WHT' },
    ]
  },
  {
    title: 'Leather Wallet - Brown',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400' }],
    category: 'Accessories',
    description: 'Genuine leather bifold wallet with multiple card slots and RFID protection.',
    price: 899,
    discountPrice: 699,
    originalPrice: 899,
    stock: 60,
    sku: 'WAL-BRN-005',
    brand: 'LeatherCraft',
    status: 'Active',
    isApproved: true,
    variants: []
  },
  {
    title: 'Smartwatch Series 5',
    image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400' }],
    category: 'Electronics',
    description: 'Fitness tracking smartwatch with heart rate monitor, GPS, and water resistance.',
    price: 7999,
    discountPrice: 5999,
    originalPrice: 7999,
    stock: 20,
    sku: 'WAT-BLK-006',
    brand: 'TechFit',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '42mm', color: 'Black', stock: 10, sku: 'WAT-BLK-006-42' },
      { size: '46mm', color: 'Black', stock: 10, sku: 'WAT-BLK-006-46' },
    ]
  },
  {
    title: 'Denim Jeans - Slim Fit',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }],
    category: 'Clothing',
    description: 'Classic slim-fit denim jeans with stretch comfort and modern styling.',
    price: 1799,
    discountPrice: 1399,
    originalPrice: 1799,
    stock: 35,
    sku: 'JNS-BLU-007',
    brand: 'DenimCo',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: '30', color: 'Blue', stock: 8, sku: 'JNS-BLU-007-30' },
      { size: '32', color: 'Blue', stock: 10, sku: 'JNS-BLU-007-32' },
      { size: '34', color: 'Blue', stock: 10, sku: 'JNS-BLU-007-34' },
      { size: '36', color: 'Blue', stock: 7, sku: 'JNS-BLU-007-36' },
    ]
  },
  {
    title: 'Backpack - Grey',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' }],
    category: 'Accessories',
    description: 'Water-resistant laptop backpack with USB charging port and multiple compartments.',
    price: 1499,
    discountPrice: 1199,
    originalPrice: 1499,
    stock: 45,
    sku: 'BAG-GRY-008',
    brand: 'TravelPro',
    status: 'Active',
    isApproved: true,
    variants: []
  },
  {
    title: 'Sunglasses - Aviator',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400' }],
    category: 'Accessories',
    description: 'UV400 polarized aviator sunglasses with metal frame and scratch-resistant lenses.',
    price: 999,
    discountPrice: 749,
    originalPrice: 999,
    stock: 55,
    sku: 'SUN-GLD-009',
    brand: 'OpticZone',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'One Size', color: 'Gold', stock: 30, sku: 'SUN-GLD-009-GLD' },
      { size: 'One Size', color: 'Black', stock: 25, sku: 'SUN-GLD-009-BLK' },
    ]
  },
  {
    title: 'Bluetooth Speaker',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    images: [{ url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' }],
    category: 'Electronics',
    description: 'Portable waterproof Bluetooth speaker with 20W output and 12-hour battery life.',
    price: 2499,
    discountPrice: 1799,
    originalPrice: 2499,
    stock: 30,
    sku: 'SPK-BLK-010',
    brand: 'BassBoost',
    status: 'Active',
    isApproved: true,
    variants: [
      { size: 'One Size', color: 'Black', stock: 15, sku: 'SPK-BLK-010-BLK' },
      { size: 'One Size', color: 'Red', stock: 15, sku: 'SPK-BLK-010-RED' },
    ]
  },
];

const seedProducts = async () => {
  try {
    await Product.deleteMany({});
    console.log('🗑️  Old products cleared');

    const created = await Product.insertMany(products);
    console.log(`✅ ${created.length} products seeded successfully!`);

    created.forEach(p => {
      console.log(`   - ${p.title} (${p.sku}) — ₹${p.discountPrice || p.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedProducts();
