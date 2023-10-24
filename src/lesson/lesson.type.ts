import { Prisma } from '@prisma/client';

export const lessonSelectObj: Prisma.LessonSelect = {
  id: true,
  day: true,
  time: true,
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
