import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCronJobDto {
  @IsString({ message: 'Name should be string' })
  name: string;

  @IsString({ message: 'Time should be string' })
  time: string;

  @IsNumber({}, { message: 'Time should be string' })
  lessonId: number;

  @IsNumber({}, { message: 'Time should be string' })
  telegramId: number;

  @IsOptional()
  @IsString({ message: 'message should be string' })
  message?: string;

  @IsOptional()
  @IsString({ message: 'message should be string' })
  groupName?: string;
}
