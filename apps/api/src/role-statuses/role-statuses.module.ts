import { Module } from '@nestjs/common';
import { RoleStatusesService } from './role-statuses.service';
import { RoleStatusesController } from './role-statuses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RoleStatusesController],
  providers: [RoleStatusesService],
  exports: [RoleStatusesService],
})
export class RoleStatusesModule {}
