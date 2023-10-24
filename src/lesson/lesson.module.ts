import { forwardRef, Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { PrismaService } from '../prisma.service';
import { CronJobModule } from '../cron-job/cron-job.module';

@Module({
  imports: [CronJobModule],
  controllers: [LessonController],
  providers: [LessonService, PrismaService],
  exports: [LessonService],
})
export class LessonModule {}
