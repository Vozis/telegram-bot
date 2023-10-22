import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const newUser = await this.prismaService.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        userName: createUserDto.userName,
        isAdmin: createUserDto.isAdmin,
        telegramId: createUserDto.telegramId,
        groups: {
          connect: {
            id: createUserDto.groupId,
          },
        },
      },
    });

    return newUser;
  }

  async toggleGroup(telegramId: number, groupId: number) {
    const isExist = await this.prismaService.user
      .count({
        where: {
          telegramId,
          groups: {
            some: {
              id: groupId,
            },
          },
        },
      })
      .then(Boolean);

    const updatedUser = await this.prismaService.user.update({
      where: {
        telegramId,
      },
      data: {
        groups: {
          [isExist ? 'disconnect' : 'connect']: {
            id: groupId,
          },
        },
      },
    });

    return !isExist;
  }

  async getAll() {
    return this.prismaService.user.findMany();
  }

  async getByTelegramId(id: number): Promise<User> {
    return this.prismaService.user.findUnique({
      where: {
        telegramId: id,
      },
    });
  }

  async remove(id: number) {
    return this.prismaService.user.delete({
      where: { telegramId: id },
    });
  }
}
