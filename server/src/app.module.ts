import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './modules/chat/chat.gateway';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory:(configService: ConfigService)=>({
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        ssl: {
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        autoLoadEntities: true,
      })

    }),
    

    // MailerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     transport: {
    //       host: configService.get<string>('MAILER_HOST'),
    //       auth: {
    //         user: configService.get<string>('MAILER_USER'),
    //         pass: configService.get<string>('MAILER_PASS'),
    //       },
    //     },
    //   }),
    // }),

    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    

    StorageModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule { }
