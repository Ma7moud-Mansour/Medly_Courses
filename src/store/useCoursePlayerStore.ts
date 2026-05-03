"use client";

import { create } from "zustand";

type CoursePlayerState = {
  currentLessonId?: string;
  progress: Record<string, number>;
  playbackSpeed: number;
  completedLessonIds: string[];
  setLesson: (lessonId: string) => void;
  saveProgress: (lessonId: string, positionSeconds: number) => void;
  markComplete: (lessonId: string) => void;
  setPlaybackSpeed: (speed: number) => void;
};

export const useCoursePlayerStore = create<CoursePlayerState>((set) => ({
  currentLessonId: undefined,
  progress: {},
  playbackSpeed: 1,
  completedLessonIds: [],
  setLesson: (lessonId) => set({ currentLessonId: lessonId }),
  saveProgress: (lessonId, positionSeconds) =>
    set((state) => ({
      progress: {
        ...state.progress,
        [lessonId]: positionSeconds,
      },
    })),
  markComplete: (lessonId) =>
    set((state) => ({
      completedLessonIds: state.completedLessonIds.includes(lessonId)
        ? state.completedLessonIds
        : [...state.completedLessonIds, lessonId],
    })),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
