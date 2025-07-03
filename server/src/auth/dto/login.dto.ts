import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty,  IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: `Enter user name`,
    example: `johnBanegaDon`,
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: `Enter password`,
    example: `john543`,
  })
  password: string;
}
