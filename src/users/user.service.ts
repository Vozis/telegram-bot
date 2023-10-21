import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    console.log(createUserDto);
    // return this.prismaService.user.create({
    //   data: {},
    // });
  }

  async getAll() {
    return this.prismaService.user.findMany();
  }

  async remove(id: number) {
    return this.prismaService.user.delete({
      where: { id },
    });
  }
}
