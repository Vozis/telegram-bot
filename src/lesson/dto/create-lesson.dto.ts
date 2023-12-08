import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

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

  @IsBoolean()
  isEnable: boolean;

  @IsNumber({}, { message: 'Продолжительность должна быть числом' })
  @IsOptional()
  duration: number;

  @IsNumber({}, { message: 'groupId должны быть числом' })
  groupId: number;
}
