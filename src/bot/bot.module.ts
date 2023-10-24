import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';

import { UserModule } from '../user/user.module';
import { GroupModule } from '../group/group.module';
import { CreateLessonScene } from './scenes/create-lessons.wizard';
import { LessonModule } from '../lesson/lesson.module';
import { CronJobModule } from '../cron-job/cron-job.module';
import { UpdateLessonScene } from './scenes/update-lessons.wizard';

@Module({
  providers: [BotUpdate, CreateLessonScene, UpdateLessonScene],
  imports: [UserModule, GroupModule, LessonModule, CronJobModule],
})
export class BotModule {}