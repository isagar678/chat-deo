import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: `Enter user name`,
        example: `john`
    })
    username: string;
    
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: `Enter password`,
        example: `changeme`
    })
    password: string;
}