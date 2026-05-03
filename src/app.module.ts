import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/configs/environment.config';
import { PrismaModule } from '@/database/prisma.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CommonModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
