import { Prisma } from '@prisma/client';

export const cronJobSelectObj: Prisma.CronJobSelect = {
  id: true,
  name: true,
  time: true,
  message: true,
  actions: true,
  groupId: true,
  lessonId: true,
  group: {
    select: {
      id: true,
      telegramId: true,
    },
  },
  lesson: {
    select: {
      id: true,
      day: true,
      time: true,
      group: {
        select: {
          name: true,
          id: true,
          telegramId: true,
        },
      },
    },
  },
};

export type CronJobSelect = Prisma.CronJobGetPayload<{
  select: typeof cronJobSelectObj;
}>;
