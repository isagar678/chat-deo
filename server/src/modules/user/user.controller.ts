import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('find/friend')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'OAuth endpoint' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async searchUsers(@Query() input: string) {
    return await this.userService.searchUsers(input)
  }
}
