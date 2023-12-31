import { IsEnum, IsNumber, IsString } from 'class-validator';
import { LevelEnum } from '@prisma/client';

export class CreateGroupDto {
  @IsString({
    message: 'Имя должно быть строкой',
  })
  name: string;

  @IsNumber({}, { message: 'telegramId must be a number' })
  telegramId: number;

  @IsString({ message: 'Неправильный уровень' })
  @IsEnum(LevelEnum)
  level?: LevelEnum;
}
