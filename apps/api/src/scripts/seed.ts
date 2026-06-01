import bcrypt from 'bcryptjs';
import prisma from '../db/client.js';

async function seed() {
  console.log('🌱 Starting Bezon Database Seeding...');

  // Clean existing records in reverse dependency order
  console.log('🧹 Clearing existing database records...');
  
  await prisma.payment.deleteMany({});
  await prisma.deliveryTimeline.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.orderTimeline.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.deliveryPartner.deleteMany({});
  await prisma.seller.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('✅ Database cleared.');

  // Generate passwords
  console.log('🔑 Generating hashed passwords for demo accounts...');
  const adminPassHash = await bcrypt.hash('Admin@1234', 12);
  const sellerPassHash = await bcrypt.hash('Seller@1234', 12);
  const deliveryPassHash = await bcrypt.hash('Delivery@1234', 12);
  const customerPassHash = await bcrypt.hash('Customer@1234', 12);

  // Create Users & Profiles
  console.log('👤 Creating Users & Role Profiles...');

  const admin = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'admin@bezon.app',
      passwordHash: adminPassHash,
      role: 'admin',
      isActive: true,
      emailVerified: true,
    },
  });

  const seller1User = await prisma.user.create({
    data: {
      name: 'Acoustic Labs Manager',
      email: 'seller1@bezon.app',
      passwordHash: sellerPassHash,
      role: 'seller',
      isActive: true,
      emailVerified: true,
    },
  });

  const seller1Profile = await prisma.seller.create({
    data: {
      userId: seller1User.id,
      shopName: 'Acoustic Labs',
      shopSlug: 'acoustic-labs',
      status: 'approved',
      description: 'High fidelity audio equipment and premium acoustics.',
    },
  });

  const seller2User = await prisma.user.create({
    data: {
      name: 'Sartorial Goods Manager',
      email: 'seller2@bezon.app',
      passwordHash: sellerPassHash,
      role: 'seller',
      isActive: true,
      emailVerified: true,
    },
  });

  const seller2Profile = await prisma.seller.create({
    data: {
      userId: seller2User.id,
      shopName: 'Sartorial Goods',
      shopSlug: 'sartorial-goods',
      status: 'approved',
      description: 'Finest hand-made leather wallets and clothing accessories.',
    },
  });

  const deliveryUser = await prisma.user.create({
    data: {
      name: 'Devon Webb',
      email: 'delivery1@bezon.app',
      passwordHash: deliveryPassHash,
      role: 'delivery',
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.deliveryPartner.create({
    data: {
      userId: deliveryUser.id,
      vehicleType: 'bike',
      vehicleNumber: 'MH-02-AB-1234',
      isAvailable: true,
      rating: 4.9,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'customer1@bezon.app',
      passwordHash: customerPassHash,
      role: 'customer',
      isActive: true,
      emailVerified: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: customerUser.id,
      label: 'Home',
      fullName: 'Jane Doe',
      phone: '9876543210',
      line1: 'Flat 102, Block C, Green Apartments',
      line2: 'Link Road, Santacruz West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400054',
      country: 'India',
      isDefault: true,
    },
  });

  console.log('✅ Users and role profiles generated.');

  // Create Categories
  console.log('📁 Creating Product Categories...');
  const catElectronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Audio, smart devices, gadgets, and components.',
    },
  });

  const catApparel = await prisma.category.create({
    data: {
      name: 'Apparel & Leather',
      slug: 'apparel-leather',
      description: 'Premium wallets, clothing, and lifestyle gear.',
    },
  });

  console.log('✅ Categories created.');

  // Create Products, Variants, and Variant-Level Images
  console.log('📦 Seeding Products & Inventory Variants...');

  // Headphones from Seller 1
  const productHeadphones = await prisma.product.create({
    data: {
      sellerId: seller1Profile.id,
      categoryId: catElectronics.id,
      title: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones',
      brand: 'Acoustic',
      status: 'published',
      basePrice: 4999,
      comparePrice: 6999,
      totalStock: 20,
      description: 'Experience premium acoustic definition with high-fidelity sound, custom drivers, and active noise cancellation (ANC). Designed with memory foam cushions for comfortable listening sessions.',
    },
  });

  // Create variants with their own images (images belong to variants now)
  const hpBlack = await prisma.productVariant.create({
    data: {
      productId: productHeadphones.id,
      sku: 'AC-HP-BLK',
      price: 4999,
      comparePrice: 6999,
      stock: 12,
      lowStockAlert: 5,
      attributes: { color: 'Matte Black' },
    },
  });

  await prisma.productImage.create({
    data: {
      variantId: hpBlack.id,
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop',
      altText: 'Premium Wireless Headphones - Matte Black',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  const hpWhite = await prisma.productVariant.create({
    data: {
      productId: productHeadphones.id,
      sku: 'AC-HP-WHT',
      price: 5299,
      comparePrice: 7299,
      stock: 8,
      lowStockAlert: 5,
      attributes: { color: 'Silver White' },
    },
  });

  await prisma.productImage.create({
    data: {
      variantId: hpWhite.id,
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop',
      altText: 'Premium Wireless Headphones - Silver White',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  // Wallet from Seller 2
  const productWallet = await prisma.product.create({
    data: {
      sellerId: seller2Profile.id,
      categoryId: catApparel.id,
      title: 'Minimalist Leather Wallet',
      slug: 'minimalist-leather-wallet',
      brand: 'Sartorial',
      status: 'published',
      basePrice: 1499,
      comparePrice: 1999,
      totalStock: 5,
      description: 'A gorgeous full-grain leather wallet designed for standard pocket comfort and durability. Holds up to 8 cards and cash notes.',
    },
  });

  const walletTan = await prisma.productVariant.create({
    data: {
      productId: productWallet.id,
      sku: 'SAR-WL-TAN',
      price: 1499,
      comparePrice: 1999,
      stock: 5,
      lowStockAlert: 3,
      attributes: { color: 'Tan Brown' },
    },
  });

  await prisma.productImage.create({
    data: {
      variantId: walletTan.id,
      url: 'https://images.unsplash.com/photo-1627124765135-5e12c73b2f76?w=500&auto=format&fit=crop',
      altText: 'Minimalist Leather Wallet - Tan Brown',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  console.log('✅ Products & variants successfully seeded.');
  console.log('🎉 Bezon database seeding completed successfully!');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
