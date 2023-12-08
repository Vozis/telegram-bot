import { Prisma } from '@prisma/client';

export const groupSelectObj: Prisma.GroupSelect = {
  id: true,
  telegramId: true,
  name: true,
  slug: true,
  level: true,
};

export type GroupSelect = Prisma.GroupGetPayload<{
  select: typeof groupSelectObj;
}>;
