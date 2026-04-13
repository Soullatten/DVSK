export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
  sku: string;
  priceOverride: number | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  basePrice: string; // Decimal comes back as string from prisma
  salePrice: string | null;
  category: Category;
  tag: string;
  gender: string;
  images: ProductImage[];
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  _count?: { reviews: number };
}

export interface PaginatedProducts {
  success: boolean;
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    salePrice: string | null;
    isActive: boolean;
  };
  variant: {
    id: string;
    size: string;
    color: string;
    colorHex: string | null;
    stock: number;
    priceOverride: string | null;
    sku: string;
  };
  unitPrice: string;
  totalPrice: number;
}

export interface CartResponse {
  success: boolean;
  data: {
    items: CartItem[];
    total: number;
    itemCount: number;
  };
}
