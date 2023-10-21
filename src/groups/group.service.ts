import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupsDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createGroupsDto: CreateGroupDto) {
    console.log('createGroupsDto: ', createGroupsDto);
    return this.prismaService.group.create({
      data: {
        name: createGroupsDto.name,
        telegramId: createGroupsDto.telegramId,
      },
    });
  }

  async getAll() {
    return this.prismaService.group.findMany();
  }

  async update(id: number, updateGroupsDto: UpdateGroupsDto) {
    console.log(updateGroupsDto);

    return this.prismaService.group.update({
      where: { id },
      data: updateGroupsDto,
    });
  }

  async remove(id: number) {
    return this.prismaService.group.delete({
      where: { id },
    });
  }
}
