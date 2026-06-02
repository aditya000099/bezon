import bcrypt from 'bcryptjs';
import prisma from '../db/client.js';
import { CryptoUtil } from '../utils/crypto.util.js';

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
  await prisma.product.deleteMany({});
  await prisma.variantGroup.deleteMany({});
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
      gstin: '22AAAAA0000A1Z5',
      panNumber: 'ABCDE1234F',
      bankNameEnc: CryptoUtil.encrypt('State Bank of India'),
      bankAccountEnc: CryptoUtil.encrypt('1234567890'),
      ifscEnc: CryptoUtil.encrypt('SBIN0001234'),
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
      gstin: '27BBBBB1111B2Z6',
      panNumber: 'VWXYZ5678G',
      bankNameEnc: CryptoUtil.encrypt('HDFC Bank'),
      bankAccountEnc: CryptoUtil.encrypt('0987654321'),
      ifscEnc: CryptoUtil.encrypt('HDFC0004321'),
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

  const vgHeadphones = await prisma.variantGroup.create({
    data: { name: 'Premium Wireless Headphones' },
  });

  const hpBlack = await prisma.product.create({
    data: {
      sellerId: seller1Profile.id,
      categoryId: catElectronics.id,
      variantGroupId: vgHeadphones.id,
      title: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones-blk',
      brand: 'Acoustic',
      status: 'published',
      description:
        'Experience premium acoustic definition with high-fidelity sound, custom drivers, and active noise cancellation (ANC). Designed with memory foam cushions for comfortable listening sessions.',
      sku: 'AC-HP-BLK',
      basePrice: 4999,
      comparePrice: 6999,
      totalStock: 12,
      lowStockAlert: 5,
      attributes: { color: 'Matte Black' },
    },
  });

  await prisma.productImage.create({
    data: {
      productId: hpBlack.id,
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop',
      altText: 'Premium Wireless Headphones - Matte Black',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  const hpWhite = await prisma.product.create({
    data: {
      sellerId: seller1Profile.id,
      categoryId: catElectronics.id,
      variantGroupId: vgHeadphones.id,
      title: 'Premium Wireless Headphones',
      slug: 'premium-wireless-headphones-wht',
      brand: 'Acoustic',
      status: 'published',
      description:
        'Experience premium acoustic definition with high-fidelity sound.',
      sku: 'AC-HP-WHT',
      basePrice: 5299,
      comparePrice: 7299,
      totalStock: 8,
      lowStockAlert: 5,
      attributes: { color: 'Silver White' },
    },
  });

  await prisma.productImage.create({
    data: {
      productId: hpWhite.id,
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop',
      altText: 'Premium Wireless Headphones - Silver White',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  // Wallet from Seller 2
  const vgWallet = await prisma.variantGroup.create({
    data: { name: 'Minimalist Leather Wallet' },
  });

  const walletTan = await prisma.product.create({
    data: {
      sellerId: seller2Profile.id,
      categoryId: catApparel.id,
      variantGroupId: vgWallet.id,
      title: 'Minimalist Leather Wallet',
      slug: 'minimalist-leather-wallet-tan',
      brand: 'Sartorial',
      status: 'published',
      description:
        'A gorgeous full-grain leather wallet designed for standard pocket comfort and durability. Holds up to 8 cards and cash notes.',
      sku: 'SAR-WL-TAN',
      basePrice: 1499,
      comparePrice: 1999,
      totalStock: 5,
      lowStockAlert: 2,
      attributes: { color: 'Tan' },
    },
  });

  await prisma.productImage.create({
    data: {
      productId: walletTan.id,
      url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop',
      altText: 'Leather Wallet Tan',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  const wgWallet2 = await prisma.product.create({
    data: {
      sellerId: seller2Profile.id,
      categoryId: catApparel.id,
      variantGroupId: vgWallet.id,
      title: 'Minimalist Leather Wallet',
      slug: 'minimalist-leather-wallet-brn',
      brand: 'Sartorial',
      status: 'published',
      description:
        'Hand-crafted minimalist leather wallet designed to hold essential cards and cash without the bulk. Premium full-grain leather in Tan Brown.',
      sku: 'SR-WLT-BRN',
      basePrice: 1999,
      comparePrice: 2499,
      totalStock: 15,
      lowStockAlert: 3,
      attributes: { color: 'Tan Brown' },
    },
  });

  await prisma.productImage.create({
    data: {
      productId: wgWallet2.id,
      url: 'https://media-ik.croma.com/prod/https://media.tatacroma.com/Croma%20Assets/Communication/Mobile%20Accessories/Images/300932_0_ajovrw.png',
      altText: 'Bapple Wallet - Tan Brown',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  // Additional New Products
  console.log('📦 Seeding Additional New Products...');

  const catHome = await prisma.category.create({
    data: {
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Premium home decor, kitchenware, and living essentials.',
    },
  });

  const productCoffee = await prisma.product.create({
    data: {
      sellerId: seller1Profile.id,
      categoryId: catHome.id,
      title: 'Artisan Pour-Over Coffee Maker',
      slug: 'artisan-pour-over-coffee-maker',
      brand: 'BrewMaster',
      status: 'published',
      description:
        'Elegant glass pour-over coffee maker with a reusable stainless steel filter. Perfect for crafting a clean, rich cup of coffee every morning.',
      sku: 'BM-CFF-MKB',
      basePrice: 2499,
      comparePrice: 3000,
      totalStock: 30,
      lowStockAlert: 10,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: productCoffee.id,
      url: 'https://bezon-assets.s3.ap-south-1.amazonaws.com/uploads/1780383839573_1_6322b2b3_2232_4b50_97ee_38b13db109b3_png.png',
      altText: 'Artisan Pour-Over Coffee Maker',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  const productLamp = await prisma.product.create({
    data: {
      sellerId: seller2Profile.id,
      categoryId: catHome.id,
      title: 'Ligray Desk Lamp',
      slug: 'modern-minimalist-desk-lamp',
      brand: 'Lumina',
      status: 'published',
      description:
        'Sleek, minimalist LED desk lamp with adjustable brightness and color temperature. Features wireless charging pad in the base.',
      sku: 'LUM-DL-WHT',
      basePrice: 3499,
      comparePrice: 4999,
      totalStock: 25,
      lowStockAlert: 5,
    },
  });

  await prisma.productImage.create({
    data: {
      productId: productLamp.id,
      url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop',
      altText: 'Dgray Desk Lamp',
      isPrimary: true,
      sortOrder: 0,
    },
  });

  console.log('✅ Additional Products seeded successfully.');
  console.log('🎉 Database seeding complete!');
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
