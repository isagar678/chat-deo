import { Body, Controller, Post, Get, Put, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { GroupService } from './group.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User } from '@supabase/supabase-js';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a group' })
  @ApiResponse({ status: 200, description: 'Group created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createGroup(@CurrentUser() user: User, @Body() body: { name: string }) {
    return this.groupService.createGroup(user, body.name);
  }

  @Get('my-groups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user groups' })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully' })
  async getMyGroups(@CurrentUser() user: User) {
    return this.groupService.getGroupsByUserId(Number(user.id));
  }

  @Get(':groupId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get group by ID' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupById(@Param('groupId') groupId: number) {
    return this.groupService.getGroupById(groupId);
  }

  @Put(':groupId/add-member')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add member to group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Member added successfully' })
  @ApiResponse({ status: 404, description: 'Group or user not found' })
  async addMemberToGroup(
    @Param('groupId') groupId: number,
    @Body() body: { userId: number }
  ) {
    return this.groupService.addMemberToGroup(groupId, body.userId);
  }

  @Delete(':groupId/remove-member')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove member from group' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Group or user not found' })
  async removeMemberFromGroup(
    @Param('groupId') groupId: number,
    @Body() body: { userId: number }
  ) {
    return this.groupService.removeMemberFromGroup(groupId, body.userId);
  }

  @Get(':groupId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get group messages' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupMessages(
    @Param('groupId') groupId: number,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0
  ) {
    return this.groupService.getGroupMessages(groupId, limit, offset);
  }
}
