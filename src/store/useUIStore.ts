"use client";

import { create } from "zustand";

type UIState = {
  cartOpen: boolean;
  mobileMenuOpen: boolean;
  setCartOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  mobileMenuOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
}));
