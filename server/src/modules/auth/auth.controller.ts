import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleOAuthGuard } from './guard/o-auth.guard';
import { Response } from 'express';
import { AccessTokenDto } from './dto/accessToken.dto';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/enum/role.enum';
import { RolesGuard } from './guard/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login through username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 409, description: 'User Already Exist' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async login(@Request() req: Request & { user: any }) {
    return this.authService.login(req.user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 409, description: 'User Already Exist' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async register(@Body(ValidationPipe) userData: RegisterDto) {
    return await this.authService.register(userData);
  }

  @Post('token')
  @ApiOperation({ summary: 'Get new access token from refresh token' })
  @ApiBody({ type: AccessTokenDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async getAccessToken(@Body(ValidationPipe) accessTokenDto: AccessTokenDto, @Ip() ip: string) {
    return await this.authService.generateAccessTokenFromRefreshToken(accessTokenDto?.refreshToken, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  getProfile(@Request() req: Request & { user: any }): any {
    return req.user;
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  @ApiOperation({ summary: 'OAuth endpoint' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async auth() { /*   Method is empty as the endpoint will redirect to google/redirect */ }

  @Get('google/redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(
    @Req() req: Request & { user: any },
    @Res() res: Response,
  ) {
    const data = await this.authService.googleRegister(req.user);
    res.cookie('access_token', data.access_token)
    res.cookie('refresh_token', data.refresh_token)
    res.redirect('http://localhost:3000/api');
  }

  @Get('admin/route/test')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  async routeForAdmin(@Req() req: Request & { user: any },) {
    return 'admin route'
  }
}
