"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PurchasedCoursesState = {
  courseIds: string[];
  addMany: (courseIds: string[]) => void;
  has: (courseId: string) => boolean;
};

export const usePurchasedCoursesStore = create<PurchasedCoursesState>()(
  persist(
    (set, get) => ({
      courseIds: [],
      addMany: (courseIds) =>
        set((state) => ({
          courseIds: Array.from(new Set([...state.courseIds, ...courseIds])),
        })),
      has: (courseId) => get().courseIds.includes(courseId),
    }),
    {
      name: "medly-purchased-courses",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
