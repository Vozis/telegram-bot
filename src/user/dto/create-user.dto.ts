import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: 'Имя должно быть строкой',
  })
  @IsOptional()
  firstName?: string;

  @IsString({
    message: 'Фамилия должно быть строкой',
  })
  @IsOptional()
  lastName?: string;

  @IsString({
    message: 'Имя должно быть строкой',
  })
  userName: string;

  @IsBoolean()
  isAdmin: boolean;

  @IsNumber({}, { message: 'telegramId must be a number' })
  telegramId: number;

  @IsNumber({}, { message: 'GroupId must be a number' })
  groupId: number;
}
