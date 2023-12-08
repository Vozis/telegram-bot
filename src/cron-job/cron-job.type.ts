import { CreateCronJobDto } from './dto/create-cron-job.dto';

import { LessonSelect } from '../lesson/lesson.type';

export interface CreateLessonCronJobForDb {
  cronJobInfo: CreateCronJobDto;
  lesson: LessonSelect;
  type: string;
}

export interface CreateTaskCronJobForDb {
  day: string;
  type: string;
  text: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  rightAnswer: string;
  groupName: string;
}
