import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserSelect } from './user.type';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.prismaService.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        userName: createUserDto.lastName,
        isAdmin: createUserDto.isAdmin,
        telegramId: createUserDto.telegramId,
        groupId: createUserDto.groupId,
      },
    });
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
