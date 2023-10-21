import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Level } from '@prisma/client';

export class CreateGroupDto {
  @IsString({
    message: 'Имя должно быть строкой',
  })
  name: string;

  @IsNumber({}, { message: 'telegramId must be a number' })
  telegramId: number;

  @IsString({ message: 'Неправильный уровень' })
  @IsEnum(Level)
  @IsOptional()
  level?: Level;
}
