import { LessonTypeEnum, Prisma } from '@prisma/client';

export const lessonSelectObj: Prisma.LessonSelect = {
  id: true,
  day: true,
  time: true,
  name: true,
  type: true,
  duration: true,
  isEnable: true,
  groupId: true,
  group: {
    select: {
      id: true,
      telegramId: true,
      name: true,
      level: true,
    },
  },
};

export type LessonSelect = Prisma.LessonGetPayload<{
  select: typeof lessonSelectObj;
}>;

export interface LessonObj {
  name: string;
  time: string;
  duration: number;
  type: string;
}

export type LessonScheduleObject = Record<string, LessonObj[]>;

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export const getEntries = <T extends object>(obj: T) =>
  Object.entries(obj) as Entries<T>;
