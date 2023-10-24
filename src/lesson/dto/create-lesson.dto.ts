import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLessonDto {
  @IsString({
    message: 'День недели должен быть строкой',
  })
  day: string;

  @IsNumber({}, { message: 'Час должен быть числом' })
  time: number;

  @IsBoolean()
  isEnable: boolean;

  @IsNumber({}, { message: 'Продолжительность должна быть числом' })
  @IsOptional()
  duration: number;

  @IsNumber({}, { message: 'groupId должны быть числом' })
  groupId: number;
}
