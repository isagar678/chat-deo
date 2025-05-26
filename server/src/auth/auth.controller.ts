import { Body, Controller, Get, HttpStatus, Post, Req, Request, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleOAuthGuard } from './guard/o-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }
  
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: "Login through username and password" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: "Api success" })
  @ApiResponse({ status: 422, description: "Bad Request or API error message" })
  @ApiResponse({ status: 404, description: "Not found!" })
  @ApiResponse({ status: 409, description: "User Already Exist" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  async login(@Request() req) {
    return this.authService.login(req.user)
  }

  @Post('register')
  @ApiOperation({ summary: "Register user" })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: "Api success" })
  @ApiResponse({ status: 422, description: "Bad Request or API error message" })
  @ApiResponse({ status: 404, description: "Not found!" })
  @ApiResponse({ status: 409, description: "User Already Exist" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  async register(@Body(ValidationPipe) userData:RegisterDto) {
    return await this.authService.register(userData)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({ status: 200, description: "Api success" })
  @ApiResponse({ status: 404, description: " Not found!" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(GoogleOAuthGuard)
  @Get('google')
  @ApiOperation({ summary: "OAuth endpoint" })
  @ApiResponse({ status: 200, description: "Api success" })
  @ApiResponse({ status: 404, description: " Not found!" })
  @ApiResponse({ status: 500, description: "Internal server error!" })
  async auth() { }

  @Get('google/redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res:Response) {
    const token = await this.authService.register(req.user);
    console.log(token,'______________________________')
    // res.cookie('access_token', token, {
    //   maxAge: 2592000000,
    //   sameSite: true,
    //   secure: false,
    // });
    res.redirect('http://localhost:3000/api')

    // return res.status(HttpStatus.OK);
  }
}
