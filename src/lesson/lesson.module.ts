import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { PrismaService } from '../prisma.service';
import { CronJobModule } from '../cron-job/cron-job.module';
import { SheetModule } from '../sheet/sheet.module';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [CronJobModule, SheetModule, GroupModule],
  controllers: [LessonController],
  providers: [LessonService, PrismaService],
  exports: [LessonService],
})
export class LessonModule {}
