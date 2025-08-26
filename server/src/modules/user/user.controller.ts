import { Body, Controller, Delete, Get, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors, Param } from '@nestjs/common';
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

  @Get('my/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user avatar info' })
  async getMyAvatar(@CurrentUser() user: User) {
    console.log('Current user avatar info:', {
      id: user.id,
      name: user.name,
      userName: user.userName,
      avatar: user.avatar
    });
    return {
      id: user.id,
      name: user.name,
      userName: user.userName,
      avatar: user.avatar
    };
  }

  @Get('test/avatar-column')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Test avatar column in database' })
  async testAvatarColumn() {
    return await this.userService.testAvatarColumn();
  }

  @Get('test/storage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Test Supabase storage connection' })
  async testStorage() {
    try {
      // Test if bucket exists
      const { data: buckets, error: bucketsError } = await this.storageService['supabase'].storage.listBuckets();
      
      if (bucketsError) {
        return {
          success: false,
          error: bucketsError.message,
          buckets: null
        };
      }

      const bucketNames = buckets?.map(b => b.name) || [];
      const targetBucket = bucketNames.find(name => name === 'chat-nest-file-bucket');

      return {
        success: true,
        buckets: bucketNames,
        targetBucketExists: !!targetBucket,
        targetBucket: targetBucket || null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        buckets: null
      };
    }
  }

  @Get('test/avatars')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Test avatar data in database' })
  async testAvatars() {
    try {
      const users = await this.userService.testAvatarColumn();
      return {
        success: true,
        users: users,
        usersWithAvatars: users.filter(user => user.avatar),
        usersWithoutAvatars: users.filter(user => !user.avatar)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Get('avatar/refresh-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get fresh signed URL for avatar' })
  async refreshAvatarUrl(@CurrentUser() user: User) {
    if (!user.avatar) {
      throw new Error('User has no avatar to refresh');
    }

    try {
      const freshUrl = await this.storageService.getFreshAvatarUrl(user.avatar);
      
      // Update the user's avatar URL in the database
      await this.userService.updateAvatar(user.id, freshUrl);
      
      return {
        success: true,
        avatarUrl: freshUrl,
        message: 'Avatar URL refreshed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to refresh avatar URL: ${error.message}`);
    }
  }

  @Get('my/friends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get list of friends with their messages' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async getMyFriends(@CurrentUser() user: User) {
    return await this.userService.getFriendsWithMessages(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile (name only)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() body: { name?: string }
  ) {
    const { name } = body;
    return await this.userService.updateProfile(user.id, { name });
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
    const senderId = req.user.id;

    const uploadResult = await this.storageService.upload(
      file,
      'chat-nest-file-bucket',
      senderId,
      recipientId,
    );

    return { 
      filePath: uploadResult.path, 
      fileUrl: uploadResult.url,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    };
  }

  // Use a named wildcard segment for path-to-regexp v7 compatibility
  @Get('file/*path')
  @UseGuards(JwtAuthGuard)
  async getFileUrl(
    @Req() req: any,
  ) {
    try {
      const rawPath: string | string[] = (req.params && (req.params.path ?? req.params[0])) as any;
      const filePath: string = Array.isArray(rawPath) ? rawPath.join('/') : rawPath;
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
      }
      // Create a signed URL for secure file access
      const signedUrl = await this.storageService.getSignedUrl(
        'chat-nest-file-bucket',
        filePath,
        3600 // 1 hour expiration
      );
      
      return { url: signedUrl };
    } catch (error) {
      throw new Error(`Failed to get file URL: ${error.message}`);
    }
  }

  @Post('avatar/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    // Test Supabase connection
    try {
      const { data: buckets, error: bucketsError } = await this.storageService['supabase'].storage.listBuckets();
      if (bucketsError) {
        console.error('Supabase connection error:', bucketsError);
      } else {
        console.log('Available Supabase buckets:', buckets?.map(b => b.name));
      }
    } catch (error) {
      console.error('Failed to list Supabase buckets:', error);
    }
    console.log('Avatar upload request received for user:', user.id);
    console.log('User data:', user);
    
    if (!file) {
      console.error('No file uploaded');
      throw new Error('No file uploaded');
    }

    console.log('File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer ? 'Buffer present' : 'No buffer'
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      console.error('Invalid file type:', file.mimetype);
      throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      throw new Error('File too large. Maximum size is 5MB.');
    }

    try {
      console.log('Starting avatar upload to storage...');
      // Upload avatar to storage
      const avatarUrl = await this.storageService.uploadAvatar(file, user.id.toString());
      console.log('Avatar uploaded successfully, URL:', avatarUrl);
      
      console.log('Updating user avatar in database...');
      // Update user's avatar in database
      const updatedUser = await this.userService.updateAvatar(user.id, avatarUrl);
      console.log('User updated in database:', updatedUser);
      console.log('Updated user avatar field:', updatedUser.avatar);
      
      return {
        success: true,
        avatarUrl: updatedUser.avatar,
        message: 'Avatar uploaded successfully'
      };
    } catch (error) {
      console.error('Avatar upload failed:', error);
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
  }

  @Delete('avatar/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar removed successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async removeAvatar(@CurrentUser() user: User) {
    try {
      // Remove avatar from database
      const updatedUser = await this.userService.updateAvatar(user.id);
      
      // If user had an avatar, delete it from storage
      if (user.avatar) {
        await this.storageService.deleteAvatar(user.avatar);
      }
      
      return {
        success: true,
        message: 'Avatar removed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to remove avatar: ${error.message}`);
    }
  }
}
