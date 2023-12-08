import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CronJobType } from '@prisma/client';

export class CreateCronJobDto {
  @IsString({ message: 'Name should be string' })
  name: string;

  @IsString({ message: 'Time should be string' })
  time: string;

  @IsOptional()
  @IsNumber({}, { message: 'LessonId should be string' })
  lessonId?: number;

  @IsNumber({}, { message: 'TelegramId should be string' })
  telegramId: number;

  @IsOptional()
  @IsString({ message: 'Message should be string' })
  message?: string;

  @IsOptional()
  @IsString({ message: 'GroupName should be string' })
  groupName?: string;

  @IsString({})
  @IsEnum(CronJobType)
  type: CronJobType;

  @IsArray()
  actions: string[];
}
