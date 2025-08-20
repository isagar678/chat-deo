import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Req,
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
import { Request, Response } from 'express';
import { AccessTokenDto } from './dto/accessToken.dto';
import { Roles } from 'src/decorators/role.decorator';
import { Role } from 'src/enum/role.enum';
import { RolesGuard } from './guard/roles.guard';
import { CurrentUser } from 'src/decorators/currentUser.decorator';
import { User } from 'src/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login through username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 409, description: 'User Already Exist' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async login(@Res({ passthrough: true }) res: Response, @CurrentUser() user: User, @Ip() ip: string) {
    return await this.authService.login(user, ip, res);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 409, description: 'User Already Exist' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async register(@Res({ passthrough: true }) res: Response, @Body(ValidationPipe) userData: RegisterDto, @Ip() ip: string) {
    return await this.authService.register(userData, ip, res);
  }

  @Post('token')
  @ApiOperation({ summary: 'Get new access token from refresh token' })
  @ApiBody({ type: AccessTokenDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async getAccessToken(@Req() request: Request, @Res({ passthrough: true }) res: Response, @Ip() ip: string) {
    try {
      const result = await this.authService.generateAccessTokenFromRefreshToken(request.cookies?.['refreshToken'], ip, res);
      return result;
    } catch (error) {
      console.log(error)
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Generate new password' })
  @ApiBody({ type: AccessTokenDto })
  @ApiResponse({ status: 201, description: 'Api success' })
  @ApiResponse({ status: 422, description: 'Bad Request or API error message' })
  @ApiResponse({ status: 404, description: 'Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  async forgotPasword(@Res({ passthrough: true }) res: Response, @Body(ValidationPipe) accessTokenDto: AccessTokenDto, @Ip() ip: string) {
    return await this.authService.generateAccessTokenFromRefreshToken(accessTokenDto?.refreshToken, ip, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user and clear refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Api success' })
  @ApiResponse({ status: 404, description: ' Not found!' })
  @ApiResponse({ status: 500, description: 'Internal server error!' })
  getProfile(@CurrentUser() user: User,): any {
    return user;
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
    @CurrentUser() user: User,
    @Res() res: Response,
    @Ip() ip: string
  ) {
    const data = await this.authService.googleRegister(user, ip, res);

    const redirectUrl = `${this.configService.get('FRONTEND_URL')}/api?access_token=${data.access_token}`;
    console.log('Redirecting to frontend with access token');
    res.redirect(redirectUrl);
  }

  @Get('admin/route/test')
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  async routeForAdmin(@CurrentUser() user: User,) {
    return 'admin route'
  }
}
