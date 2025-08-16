import { Body, Controller, Get, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/currentUser.decorator';
import { User } from 'src/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly storageService: StorageService
  ) { }

  @Get('find/person')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Search users by username or name' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async searchUsers(@Query('query') query: string, @CurrentUser() user: User) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const users = await this.userService.searchUsers(query.trim());
    // Filter out the current user from search results
    return users.filter(foundUser => foundUser.id !== user.id);
  }

  @Get('my/friends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get list of friends with their messages' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async getMyFriends(@CurrentUser() user: User) {
    return await this.userService.getFriendsWithMessages(user.id)
  }

  @Put('mark/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async markAsRead(@CurrentUser() user: User, @Body() body: { from: number }) {
    return await this.userService.markMessagesAsRead(body.from, user.id)
  }


  @Post('upload')
  @UseGuards(JwtAuthGuard) 
  @UseInterceptors(FileInterceptor('file')) 
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('recipientId') recipientId: string,
    @Req() req: any, 
  ) {
    const senderId = req.user.sub;

    const path = await this.storageService.upload(
      file,
      'chat-nest-file-bucket',
      senderId,
      recipientId,
    );

    return { filePath: path, fileType: file.mimetype };
  }
}
