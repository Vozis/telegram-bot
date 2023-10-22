import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupsDto } from './dto/update-group.dto';
import { Group } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createGroupsDto: CreateGroupDto): Promise<Group> {
    const _group = await this.prismaService.group.findUnique({
      where: {
        telegramId: createGroupsDto.telegramId,
      },
    });

    if (_group) throw new BadRequestException('Tag already exists');

    return this.prismaService.group.create({
      data: {
        name: createGroupsDto.name,
        telegramId: createGroupsDto.telegramId,
      },
    });
  }

  async getAll(): Promise<Group[]> {
    return this.prismaService.group.findMany();
  }

  async getByTelegramId(id: number): Promise<Group> {
    return this.prismaService.group.findUnique({
      where: {
        telegramId: id,
      },
    });
  }

  async update(id: number, updateGroupsDto: UpdateGroupsDto): Promise<Group> {
    console.log(updateGroupsDto);

    return this.prismaService.group.update({
      where: { id },
      data: updateGroupsDto,
    });
  }

  async remove(id: number): Promise<Group> {
    return this.prismaService.group.delete({
      where: { id },
    });
  }
}
