import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CharactersModule } from './characters/characters.module';
import { CollectionsModule } from './collections/collections.module';
import { FreeCompanyModule } from './free-company/free-company.module';
import { LodestoneModule } from './lodestone/lodestone.module';
import { XivapiModule } from './xivapi/xivapi.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    CharactersModule,
    CollectionsModule,
    FreeCompanyModule,
    LodestoneModule,
    XivapiModule,
    NotificationsModule,
    QueueModule,
  ],
})
export class AppModule {}
