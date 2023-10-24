import { Prisma } from '@prisma/client';

export const UserType: Prisma.UserSelect = {
  id: true,
  telegramId: true,
  userName: true,
  firstName: true,
  lastName: true,
  isAdmin: true,
  groups: {
    select: {
      name: true,
      id: true,
      telegramId: true,
    },
  },
};

export type UserSelect = Prisma.UserGetPayload<{
  select: typeof UserType;
}>;
