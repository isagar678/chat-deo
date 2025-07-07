import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: `Enter name`,
    example: `john`,
  })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: `Enter user name`,
    example: `johnBanegaDon`,
  })
  userName: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: `Enter user name`,
    example: `john@gmail.com`,
  })
  email: string;

  @IsNotEmpty()
  @MinLength(4)
  @ApiProperty({
    description: `Enter user name`,
    example: `john543`,
  })
  password: string;
}
