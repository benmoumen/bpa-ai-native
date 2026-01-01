import { Module } from '@nestjs/common';
import { TransitionsService } from './transitions.service';
import { TransitionsController } from './transitions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TransitionsController],
  providers: [TransitionsService],
  exports: [TransitionsService],
})
export class TransitionsModule {}
