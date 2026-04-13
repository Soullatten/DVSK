import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Categories
  const men = await prisma.category.upsert({
    where: { slug: "men" },
    update: {},
    create: { name: "Men", slug: "men", description: "Men's Collection" },
  });

  const women = await prisma.category.upsert({
    where: { slug: "women" },
    update: {},
    create: { name: "Women", slug: "women", description: "Women's Collection" },
  });

  const menTops = await prisma.category.upsert({
    where: { slug: "men-tops" },
    update: {},
    create: { name: "Men's Tops", slug: "men-tops", description: "Men's Tops", parentId: men.id },
  });

  const menBottoms = await prisma.category.upsert({
    where: { slug: "men-bottoms" },
    update: {},
    create: { name: "Men's Bottoms", slug: "men-bottoms", description: "Men's Bottoms", parentId: men.id },
  });

  const womenTops = await prisma.category.upsert({
    where: { slug: "women-tops" },
    update: {},
    create: { name: "Women's Tops", slug: "women-tops", description: "Women's Tops", parentId: women.id },
  });

  const womenDresses = await prisma.category.upsert({
    where: { slug: "women-dresses" },
    update: {},
    create: { name: "Women's Dresses", slug: "women-dresses", description: "Women's Dresses", parentId: women.id },
  });

  // Men's Products
  const menProducts = [
    {
      name: "DVSK Oversized Tee - Midnight",
      description: "Premium heavyweight cotton oversized tee with dropped shoulders. Part of the DVSK Essentials line, designed for effortless layering and everyday luxury.",
      shortDesc: "Heavyweight cotton oversized tee",
      basePrice: 2499,
      categoryId: menTops.id,
      tag: "CORE" as const,
      gender: "MEN" as const,
      isFeatured: true,
      images: [
        { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", alt: "Black oversized tee front", position: 0 },
        { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", alt: "Black oversized tee back", position: 1 },
      ],
      variants: [
        { size: "S", color: "Black", colorHex: "#000000", sku: "DVSK-OSTEE-BLK-S", stock: 25 },
        { size: "M", color: "Black", colorHex: "#000000", sku: "DVSK-OSTEE-BLK-M", stock: 40 },
        { size: "L", color: "Black", colorHex: "#000000", sku: "DVSK-OSTEE-BLK-L", stock: 35 },
        { size: "XL", color: "Black", colorHex: "#000000", sku: "DVSK-OSTEE-BLK-XL", stock: 20 },
      ],
    },
    {
      name: "DVSK Cargo Pants - Shadow",
      description: "Relaxed-fit cargo pants with utilitarian pockets and adjustable drawcord hem. Made from garment-dyed cotton twill for a lived-in feel.",
      shortDesc: "Relaxed-fit cotton cargo pants",
      basePrice: 4999,
      categoryId: menBottoms.id,
      tag: "NEW_SEASON" as const,
      gender: "MEN" as const,
      isFeatured: true,
      images: [
        { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800", alt: "Cargo pants front", position: 0 },
      ],
      variants: [
        { size: "S", color: "Charcoal", colorHex: "#333333", sku: "DVSK-CARGO-CHR-S", stock: 15 },
        { size: "M", color: "Charcoal", colorHex: "#333333", sku: "DVSK-CARGO-CHR-M", stock: 30 },
        { size: "L", color: "Charcoal", colorHex: "#333333", sku: "DVSK-CARGO-CHR-L", stock: 25 },
        { size: "XL", color: "Charcoal", colorHex: "#333333", sku: "DVSK-CARGO-CHR-XL", stock: 10 },
      ],
    },
    {
      name: "DVSK Washed Hoodie - Fog",
      description: "Vintage-wash heavyweight hoodie with kangaroo pocket and ribbed cuffs. 400gsm French terry cotton for a structured, premium drape.",
      shortDesc: "Heavyweight washed hoodie",
      basePrice: 5999,
      salePrice: 4999,
      categoryId: menTops.id,
      tag: "ESSENTIALS" as const,
      gender: "MEN" as const,
      isFeatured: false,
      images: [
        { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", alt: "Washed hoodie front", position: 0 },
      ],
      variants: [
        { size: "S", color: "Grey", colorHex: "#808080", sku: "DVSK-HOOD-GRY-S", stock: 20 },
        { size: "M", color: "Grey", colorHex: "#808080", sku: "DVSK-HOOD-GRY-M", stock: 30 },
        { size: "L", color: "Grey", colorHex: "#808080", sku: "DVSK-HOOD-GRY-L", stock: 25 },
        { size: "XL", color: "Grey", colorHex: "#808080", sku: "DVSK-HOOD-GRY-XL", stock: 15 },
      ],
    },
    {
      name: "DVSK Pleated Trousers - Onyx",
      description: "Tailored wide-leg trousers with front pleats and a high rise. Crafted from Italian wool-blend fabric with a subtle texture.",
      shortDesc: "Tailored wide-leg wool trousers",
      basePrice: 7499,
      categoryId: menBottoms.id,
      tag: "NEW_SEASON" as const,
      gender: "MEN" as const,
      isFeatured: true,
      images: [
        { url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800", alt: "Pleated trousers", position: 0 },
      ],
      variants: [
        { size: "S", color: "Black", colorHex: "#0a0a0a", sku: "DVSK-PLEAT-BLK-S", stock: 12 },
        { size: "M", color: "Black", colorHex: "#0a0a0a", sku: "DVSK-PLEAT-BLK-M", stock: 18 },
        { size: "L", color: "Black", colorHex: "#0a0a0a", sku: "DVSK-PLEAT-BLK-L", stock: 15 },
        { size: "XL", color: "Black", colorHex: "#0a0a0a", sku: "DVSK-PLEAT-BLK-XL", stock: 8 },
      ],
    },
    {
      name: "DVSK Mesh Jersey - Phantom",
      description: "Athletic mesh jersey with embroidered DVSK logo. Lightweight, breathable polyester with a loose fit ideal for warm weather or layering.",
      shortDesc: "Breathable mesh jersey",
      basePrice: 3499,
      categoryId: menTops.id,
      tag: "LIMITED_EDITION" as const,
      gender: "MEN" as const,
      isFeatured: false,
      images: [
        { url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800", alt: "Mesh jersey", position: 0 },
      ],
      variants: [
        { size: "M", color: "Black", colorHex: "#111111", sku: "DVSK-MESH-BLK-M", stock: 10 },
        { size: "L", color: "Black", colorHex: "#111111", sku: "DVSK-MESH-BLK-L", stock: 10 },
        { size: "XL", color: "Black", colorHex: "#111111", sku: "DVSK-MESH-BLK-XL", stock: 5 },
      ],
    },
  ];

  // Women's Products
  const womenProducts = [
    {
      name: "DVSK Silk Slip Dress - Noir",
      description: "Minimalist bias-cut slip dress in pure mulberry silk. Features adjustable spaghetti straps and a cowl neckline for effortless evening elegance.",
      shortDesc: "Pure silk slip dress",
      basePrice: 8999,
      categoryId: womenDresses.id,
      tag: "NEW_SEASON" as const,
      gender: "WOMEN" as const,
      isFeatured: true,
      images: [
        { url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800", alt: "Silk slip dress", position: 0 },
      ],
      variants: [
        { size: "XS", color: "Black", colorHex: "#000000", sku: "DVSK-SLIP-BLK-XS", stock: 10 },
        { size: "S", color: "Black", colorHex: "#000000", sku: "DVSK-SLIP-BLK-S", stock: 15 },
        { size: "M", color: "Black", colorHex: "#000000", sku: "DVSK-SLIP-BLK-M", stock: 20 },
        { size: "L", color: "Black", colorHex: "#000000", sku: "DVSK-SLIP-BLK-L", stock: 12 },
      ],
    },
    {
      name: "DVSK Cropped Blazer - Smoke",
      description: "Structured cropped blazer with sharp shoulders and a single-button closure. Lined in silk for a premium finish.",
      shortDesc: "Cropped tailored blazer",
      basePrice: 9999,
      categoryId: womenTops.id,
      tag: "NEW_SEASON" as const,
      gender: "WOMEN" as const,
      isFeatured: true,
      images: [
        { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800", alt: "Cropped blazer", position: 0 },
      ],
      variants: [
        { size: "XS", color: "Dark Grey", colorHex: "#3a3a3a", sku: "DVSK-BLZR-DGY-XS", stock: 8 },
        { size: "S", color: "Dark Grey", colorHex: "#3a3a3a", sku: "DVSK-BLZR-DGY-S", stock: 14 },
        { size: "M", color: "Dark Grey", colorHex: "#3a3a3a", sku: "DVSK-BLZR-DGY-M", stock: 16 },
        { size: "L", color: "Dark Grey", colorHex: "#3a3a3a", sku: "DVSK-BLZR-DGY-L", stock: 10 },
      ],
    },
    {
      name: "DVSK Ribbed Tank - Bone",
      description: "Fine-ribbed cotton tank with a fitted silhouette. Scoop neckline and raw-edge hem for an understated, effortless look.",
      shortDesc: "Fine-ribbed cotton tank",
      basePrice: 1999,
      categoryId: womenTops.id,
      tag: "ESSENTIALS" as const,
      gender: "WOMEN" as const,
      isFeatured: false,
      images: [
        { url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800", alt: "Ribbed tank", position: 0 },
      ],
      variants: [
        { size: "XS", color: "Cream", colorHex: "#f5f0e6", sku: "DVSK-TANK-CRM-XS", stock: 30 },
        { size: "S", color: "Cream", colorHex: "#f5f0e6", sku: "DVSK-TANK-CRM-S", stock: 40 },
        { size: "M", color: "Cream", colorHex: "#f5f0e6", sku: "DVSK-TANK-CRM-M", stock: 35 },
        { size: "L", color: "Cream", colorHex: "#f5f0e6", sku: "DVSK-TANK-CRM-L", stock: 25 },
      ],
    },
    {
      name: "DVSK Wide Leg Jeans - Washed Indigo",
      description: "High-waisted wide leg jeans in Japanese selvedge denim. Vintage washed for a soft hand feel with a modern oversized silhouette.",
      shortDesc: "High-waisted wide leg jeans",
      basePrice: 6499,
      salePrice: 5499,
      categoryId: womenDresses.id,
      tag: "CORE" as const,
      gender: "WOMEN" as const,
      isFeatured: false,
      images: [
        { url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800", alt: "Wide leg jeans", position: 0 },
      ],
      variants: [
        { size: "XS", color: "Indigo", colorHex: "#3f51b5", sku: "DVSK-WLJN-IND-XS", stock: 12 },
        { size: "S", color: "Indigo", colorHex: "#3f51b5", sku: "DVSK-WLJN-IND-S", stock: 18 },
        { size: "M", color: "Indigo", colorHex: "#3f51b5", sku: "DVSK-WLJN-IND-M", stock: 20 },
        { size: "L", color: "Indigo", colorHex: "#3f51b5", sku: "DVSK-WLJN-IND-L", stock: 14 },
      ],
    },
  ];

  // Create all products
  for (const product of [...menProducts, ...womenProducts]) {
    const { images, variants, ...productData } = product;
    const slug = productData.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s]+/g, "-");

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        ...productData,
        slug,
        images: { create: images },
        variants: { create: variants },
      },
    });
  }

  // Create a sample coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "10% off your first order",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: 500,
      minOrderValue: 2000,
      usageLimit: 1000,
      perUserLimit: 1,
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2026-12-31"),
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FLAT500" },
    update: {},
    create: {
      code: "FLAT500",
      description: "Flat ₹500 off on orders above ₹5000",
      discountType: "FLAT",
      discountValue: 500,
      minOrderValue: 5000,
      usageLimit: 500,
      perUserLimit: 2,
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2026-12-31"),
      isActive: true,
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
