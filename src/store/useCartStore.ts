"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartItem, Course } from "@/types";

function toCartItem(course: Course): CartItem {
  return {
    id: `cart-${course.id}`,
    courseId: course.id,
    slug: course.slug,
    title: course.title,
    thumbnail: course.thumbnail,
    price: course.price,
    discountPrice: course.discountPrice,
  };
}

function itemPrice(item: CartItem) {
  return item.discountPrice ?? item.price;
}

function calculateDiscount(subtotal: number, coupon?: string) {
  if (!coupon) {
    return 0;
  }

  const code = coupon.trim().toUpperCase();

  if (code === "MEDLY20") {
    return Math.round(subtotal * 0.2);
  }

  if (code === "FIRST100") {
    return Math.min(100, subtotal);
  }

  return 0;
}

type CartState = {
  items: CartItem[];
  coupon?: string;
  addItem: (course: Course) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: undefined,
      addItem: (course) =>
        set((state) => {
          if (state.items.some((item) => item.courseId === course.id)) {
            return state;
          }

          return { items: [...state.items, toCartItem(course)] };
        }),
      removeItem: (courseId) =>
        set((state) => ({
          items: state.items.filter((item) => item.courseId !== courseId),
        })),
      clearCart: () => set({ items: [], coupon: undefined }),
      applyCoupon: (code) => {
        const coupon = code.trim().toUpperCase();
        const valid = coupon === "MEDLY20" || coupon === "FIRST100";

        if (valid) {
          set({ coupon });
        }

        return valid;
      },
      getSubtotal: () => get().items.reduce((total, item) => total + itemPrice(item), 0),
      getDiscount: () => calculateDiscount(get().getSubtotal(), get().coupon),
      getTotal: () => Math.max(get().getSubtotal() - get().getDiscount(), 0),
    }),
    {
      name: "medly-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
