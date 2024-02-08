import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupsDto } from './dto/update-group.dto';
import { Group } from '@prisma/client';
import { GroupSelect, groupSelectObj } from './groupSelectObj';
import slugify from 'slugify';
import { SheetService } from '../sheet/sheet.service';

@Injectable()
export class GroupService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sheetService: SheetService,
  ) {}

  async createGroup(createGroupsDto: CreateGroupDto): Promise<GroupSelect> {
    const _group = await this.prismaService.group.findUnique({
      where: {
        telegramId: createGroupsDto.telegramId,
      },
      select: groupSelectObj,
    });

    if (_group)
      throw new BadRequestException(`Группа "${_group.name}" уже создана.`);

    const shortName = slugify(createGroupsDto.name, {
      locale: 'en',
      lower: true,
    });

    const newGroup = await this.prismaService.group.create({
      data: {
        name: createGroupsDto.name,
        slug: shortName,
        telegramId: createGroupsDto.telegramId,
        level: createGroupsDto.level,
      },
      select: groupSelectObj,
    });

    await this.addToSheet(newGroup.name);

    return newGroup;
  }

  async addToSheet(groupName: string) {
    const { lastIndex } = await this.sheetService.getRangeSize();
    const name = groupName.split('.')[0];
    await this.sheetService.writeGroupToSheet(lastIndex, name);
  }

  async getAllGroups(): Promise<GroupSelect[]> {
    return this.prismaService.group.findMany({
      select: groupSelectObj,
    });
  }

  async getBySlug(slug: string): Promise<GroupSelect> {
    const _group = await this.prismaService.group.findFirst({
      where: {
        slug: {
          contains: slug,
          mode: 'insensitive',
        },
      },
      select: groupSelectObj,
    });

    if (!_group)
      throw new BadRequestException(
        `Эта группа еще не добавлена в списки администраторов`,
      );

    return _group;
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

  async getGroupWhenCreate(telegramId: number): Promise<boolean> {
    const _group = await this.prismaService.group.findUnique({
      where: {
        telegramId,
      },
    });

    return !!_group;
  }

  async updateGroup(
    id: number,
    updateGroupsDto: UpdateGroupsDto,
  ): Promise<GroupSelect> {
    const shortName = slugify(updateGroupsDto.name, {
      locale: 'en',
      lower: true,
    });

    return this.prismaService.group.update({
      where: { id },
      data: {
        ...updateGroupsDto,
        slug: shortName,
      },
      select: groupSelectObj,
    });
  }

  async removeGroup(id: number): Promise<Group> {
    return this.prismaService.group.delete({
      where: { id },
    });
  }
}
