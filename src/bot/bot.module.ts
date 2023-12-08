import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';

import { UserModule } from '../user/user.module';
import { GroupModule } from '../group/group.module';
import { CreateLessonScene } from './scenes/create-lessons.wizard';
import { LessonModule } from '../lesson/lesson.module';
import { CronJobModule } from '../cron-job/cron-job.module';
import { DeleteLessonScene } from './scenes/delete-lessons.wizard';
import { GetLessonsScene } from './scenes/get-lessons.wizard';
import { CreateGroupScene } from './scenes/create-group.wizard';
import { TaskModule } from '../task/task.module';
import { SheetModule } from '../sheet/sheet.module';

@Module({
  providers: [
    BotUpdate,
    CreateLessonScene,
    DeleteLessonScene,
    GetLessonsScene,
    CreateGroupScene,
  ],
  imports: [
    UserModule,
    GroupModule,
    LessonModule,
    CronJobModule,
    TaskModule,
    SheetModule,
  ],
})
export class BotModule {}
