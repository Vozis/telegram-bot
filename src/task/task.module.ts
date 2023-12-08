import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { CronJobModule } from '../cron-job/cron-job.module';
import { SheetModule } from '../sheet/sheet.module';

@Module({
  imports: [SheetModule, CronJobModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
