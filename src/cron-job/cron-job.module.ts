import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { CronJobController } from './cron-job.controller';
import { PrismaService } from '../prisma.service';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [GroupModule],
  controllers: [CronJobController],
  providers: [CronJobService, PrismaService],
  exports: [CronJobService],
})
export class CronJobModule {}
