import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupDto } from './create-group.dto';

export class UpdateGroupsDto extends PartialType(CreateGroupDto) {}
