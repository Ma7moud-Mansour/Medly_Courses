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

function calculateDiscount(input: {
  subtotal: number;
  coupon?: string;
  couponType?: "percent" | "fixed";
  couponValue?: number;
  couponMinOrderAmount?: number;
}) {
  if (!input.coupon) {
    return 0;
  }

  const type = input.couponType;
  const value = input.couponValue ?? 0;
  const minOrderAmount = input.couponMinOrderAmount ?? 0;

  if (!type || !value || input.subtotal < minOrderAmount) {
    return 0;
  }

  if (type === "percent") {
    return Math.min(input.subtotal, Math.round((input.subtotal * value) / 100));
  }

  return Math.min(value, input.subtotal);
}

type CartCoupon = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount?: number;
};

type CartState = {
  items: CartItem[];
  coupon?: string;
  couponType?: "percent" | "fixed";
  couponValue?: number;
  couponMinOrderAmount?: number;
  addItem: (course: Course) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: CartCoupon) => void;
  clearCoupon: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: undefined,
      couponType: undefined,
      couponValue: undefined,
      couponMinOrderAmount: undefined,
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
      clearCart: () =>
        set({
          items: [],
          coupon: undefined,
          couponType: undefined,
          couponValue: undefined,
          couponMinOrderAmount: undefined,
        }),
      applyCoupon: (coupon) =>
        set({
          coupon: coupon.code.trim().toUpperCase(),
          couponType: coupon.type,
          couponValue: coupon.value,
          couponMinOrderAmount: coupon.minOrderAmount,
        }),
      clearCoupon: () =>
        set({
          coupon: undefined,
          couponType: undefined,
          couponValue: undefined,
          couponMinOrderAmount: undefined,
        }),
      getSubtotal: () => get().items.reduce((total, item) => total + itemPrice(item), 0),
      getDiscount: () =>
        calculateDiscount({
          subtotal: get().getSubtotal(),
          coupon: get().coupon,
          couponType: get().couponType,
          couponValue: get().couponValue,
          couponMinOrderAmount: get().couponMinOrderAmount,
        }),
      getTotal: () => Math.max(get().getSubtotal() - get().getDiscount(), 0),
    }),
    {
      name: "medly-cart",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
