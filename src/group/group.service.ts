import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupsDto } from './dto/update-group.dto';
import { Group } from '@prisma/client';
import { GroupSelect, groupSelectObj } from './groupSelectObj';

@Injectable()
export class GroupService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createGroupsDto: CreateGroupDto): Promise<GroupSelect> {
    const _group = await this.prismaService.group.findUnique({
      where: {
        telegramId: createGroupsDto.telegramId,
      },
      select: groupSelectObj,
    });

    if (_group)
      throw new BadRequestException(`Группа "${_group.name}" уже создана.`);

    return this.prismaService.group.create({
      data: {
        name: createGroupsDto.name,
        telegramId: createGroupsDto.telegramId,
      },
      select: groupSelectObj,
    });
  }

  async getAll(): Promise<GroupSelect[]> {
    return this.prismaService.group.findMany({
      select: groupSelectObj,
    });
  }

  async getByTelegramId(id: number): Promise<GroupSelect> {
    const _group = await this.prismaService.group.findUnique({
      where: {
        telegramId: id,
      },
      select: groupSelectObj,
    });

    if (!_group)
      throw new BadRequestException(
        `Эта группа еще не добавлена в списки администраторов`,
      );

    return _group;
  }

  async update(
    id: number,
    updateGroupsDto: UpdateGroupsDto,
  ): Promise<GroupSelect> {
    // console.log(updateGroupsDto);

    return this.prismaService.group.update({
      where: { id },
      data: updateGroupsDto,
      select: groupSelectObj,
    });
  }

  async remove(id: number): Promise<Group> {
    return this.prismaService.group.delete({
      where: { id },
    });
  }
}
