import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, UserModule,
    TypeOrmModule.forRoot({
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Oneclick1@',
      type: 'postgres',
      database: 'mydb',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    MailerModule.forRoot({
      transport: {
        host: `sandbox.smtp.mailtrap.io`,
        auth: {
          user: `71e593084812bd`,
          pass: `50a952fbc6c5ce`,
        },
      },
    }),
    ConfigModule.forRoot({ isGlobal: true , envFilePath :'.env'})
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
