import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserService } from 'src/modules/user/user.service';
import { RefreshTokens } from '../../entities/refreshToken.entity';
import { ConfigService } from '@nestjs/config';
import { handleTokenErrors } from 'src/UsefulFunction';
import { Role } from 'src/enum/role.enum';
import { Response } from 'express';

@Injectable()
export class AuthService {
  
  constructor(
    // private readonly supabaseAdmin: SupabaseClient,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    // this.supabaseAdmin = createClient(
    //   process.env.SUPABASE_URL || '',
    //   process.env.SUPABASE_SERVICE_ROLE_KEY || '', 
    //   { auth: { persistSession: false } }
    // );
   }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOne(username);
    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip, res: Response) {
    try {

      const payload = { username: user.userName, id: user.id, role: Role.User, sub:user.supabaseAuthId };
      return await this.generateTokenPair(payload, ip, res)

    } catch (error) {
      handleTokenErrors(error)
    }
  }

  async register(userData, ip, res: Response) {
    const user = await this.userService.findUser(userData);
    if (!user) {
      // const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      //   ...userData
      // });

      // if (authError) {
      //   throw new Error(`Supabase auth error: ${authError.message}`);
      // }

      // userData.supabaseAuthId = authData.user.id;

      await this.userService.create(userData);

      const payload = { username: userData.userName, id: userData.id, role: Role.Admin,sub:userData.supabaseAuthId };

      return await this.generateTokenPair(payload, ip, res)

    } else {
      throw new ConflictException();
    }
  }

  async googleRegister(userData, ip, res) {
    const user = await this.userService.findUser(userData);

    if (!user) {
      await this.userService.create(userData);
    }

    const payload = { username: userData.userName, id: userData.id, role: Role.User };

    return await this.generateTokenPair(payload, ip, res)
  }

  async isTokenBlackListed(requestToken) {
    const token = await RefreshTokens.findOne({ where: { token: requestToken } })

    if (token && token.isBlacklisted) {
      throw new UnauthorizedException('Blacklisted')
    }
    return token;
  }

  async generateAccessTokenFromRefreshToken(refreshToken, ip: string, res) {
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const verifiedPayload = this.jwtService.verify(refreshToken, { secret: this.configService.get('JWT_REFRESH_SECRET') })

      const token = await this.isTokenBlackListed(refreshToken)

      const payload = { id: verifiedPayload.id, username: verifiedPayload.username, role: verifiedPayload.role,sub:verifiedPayload.sub };


      // Generate new tokens using a method that handles refresh scenarios
      const result = await this.generateTokenPairForRefresh(payload, ip, res)

      // Then blacklist the old token
      if (token) {
        await RefreshTokens.update({ id: token.id }, { isBlacklisted: true })
      }

      return result;

    } catch (error) {
      handleTokenErrors(error);
      throw error; 
    }
  }

  async forgotPassword() { }

  async generateTokenPair(payload: any, ip: string, response) {
    const access_token = this.jwtService.sign(payload, { expiresIn: '1d', secret: this.configService.get('JWT_SECRET') });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '2d', secret: this.configService.get('JWT_REFRESH_SECRET'), });

    // Set the new refresh token cookie
    response.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: false, // false for localhost development
      sameSite: 'lax', // 'lax' for localhost development
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    await RefreshTokens.insert({ token: refresh_token, ip })

    return {
      access_token,
      refresh_token
    }

  }

  async generateTokenPairForRefresh(payload: any, ip: string, response) {
    const access_token = this.jwtService.sign(payload, { expiresIn: '1d', secret: this.configService.get('JWT_SECRET') });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '2d', secret: this.configService.get('JWT_REFRESH_SECRET'), });

    // Set the new refresh token cookie
    response.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: false, // false for localhost development
      sameSite: 'lax', // 'lax' for localhost development
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })


    // For refresh scenarios, we need to handle potential duplicate tokens more carefully
    try {
      await RefreshTokens.insert({ token: refresh_token, ip })
    } catch (error) {
      // If we get a duplicate key error, try to update the existing token
      if (error.code === '23505') { // PostgreSQL unique constraint violation
        await RefreshTokens.update(
          { token: refresh_token },
          { ip, isBlacklisted: false }
        )
      } else {
        throw error
      }
    }

    return {
      access_token,
      refresh_token
    }

  }

  verifySocketToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: this.configService.get('JWT_SECRET') });
      return { userId: payload.id, username: payload.username, role: payload.role };
    } catch (error) {
      handleTokenErrors(error)
    }
  }
}
