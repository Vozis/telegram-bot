import { Prisma } from '@prisma/client';

export const GroupType: Prisma.GroupSelect = {
  id: true,
  telegramId: true,
  name: true,
  level: true,
};

export type GroupSelect = Prisma.GroupGetPayload<{
  select: typeof GroupType;
}>;
