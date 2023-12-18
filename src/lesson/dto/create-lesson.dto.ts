import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LessonTypeEnum } from '@prisma/client';

export class CreateLessonDto {
  @IsString({
    message: 'День недели должен быть строкой',
  })
  day: string;

  @IsString({ message: 'time must be a string' })
  time: string;

  @IsString({
    message: 'Название должно быть строкой',
  })
  name: string;

  @IsEnum(LessonTypeEnum)
  type: LessonTypeEnum;

  @IsBoolean()
  isEnable: boolean;

  @IsNumber({}, { message: 'Продолжительность должна быть числом' })
  @IsOptional()
  duration?: number;

  @IsNumber({}, { message: 'groupId должны быть числом' })
  groupId: number;
}
