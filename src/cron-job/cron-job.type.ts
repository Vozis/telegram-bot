import { CreateCronJobDto } from './dto/create-cron-job.dto';

import { LessonSelect } from '../lesson/lesson.type';

export interface CreateCronJobForDb {
  cronJobInfo: CreateCronJobDto;
  lesson: LessonSelect;
  type: string;
}
