import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PrismaService } from '../prisma.service';
import { Lesson } from '@prisma/client';
import { changeDayForCronJobs, toHoursAndMinutes } from '../utils/functions';
import { CronJobService } from '../cron-job/cron-job.service';
import { LessonSelect, lessonSelectObj } from './lesson.type';

@Injectable()
export class LessonService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cronJobService: CronJobService,
  ) {}
  async create(createLessonDto: CreateLessonDto): Promise<LessonSelect> {
    const _lesson = await this.prismaService.lesson.findUnique({
      where: {
        compositeTime: {
          groupId: createLessonDto.groupId,
          day: createLessonDto.day,
          time: createLessonDto.time,
        },
      },
    });

    if (_lesson) throw new BadRequestException('Такой урок уже создан');

    const newLesson = await this.prismaService.lesson.create({
      data: {
        day: createLessonDto.day,
        time: createLessonDto.time,
        name: createLessonDto.name,
        isEnable: createLessonDto.isEnable,
        duration: createLessonDto.duration,
        group: {
          connect: {
            id: createLessonDto.groupId,
          },
        },
      },
      select: lessonSelectObj,
    });

    if (!newLesson.isEnable) return newLesson;

    await this.createCronJobs(newLesson);

    return newLesson;
  }

  async getByGroupId(groupId: number): Promise<LessonSelect[]> {
    return this.prismaService.lesson.findMany({
      where: {
        groupId: groupId,
      },
      select: lessonSelectObj,
    });
  }

  async update(
    id: number,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonSelect> {
    const updatedLesson = await this.prismaService.lesson.update({
      where: {
        id,
      },
      data: {
        day: updateLessonDto.day,
        time: updateLessonDto.time,
        name: updateLessonDto.name,
      },
      select: lessonSelectObj,
    });

    await this.cronJobService.deleteByLesson(id);

    if (!updatedLesson.isEnable) return updatedLesson;

    await this.createCronJobs(updatedLesson);

    return updatedLesson;
  }

  async remove(id: number) {
    const lessonCronJobs = await this.cronJobService.getCronJobsForLesson(id);

    lessonCronJobs.forEach(async item => {
      await this.cronJobService.deleteCronJob(item.name);
      console.log(`Удалено уведомление ${item.name}`);
    });

    const lesson = await this.prismaService.lesson.delete({
      where: {
        id,
      },
    });

    return lesson;
  }

  private async createCronJobs(lesson: LessonSelect) {
    const dayNumber = changeDayForCronJobs(lesson.day);
    const lessonTime = toHoursAndMinutes(lesson.time);

    const jobNameForDay = `${lesson.id}-${dayNumber - 1}:${lessonTime.hours}:${
      lessonTime.minutes
    }`;
    const jobNameForTwoHours = `${lesson.id}-${dayNumber}:${
      lessonTime.hours - 2 < 0 ? lessonTime.hours + 22 : lessonTime.hours - 2
    }:${lessonTime.minutes}`;
    const jobTimeForDay = `${lessonTime.minutes} ${lessonTime.hours} * * ${
      dayNumber - 1
    }`;
    const jobTimeForTwoHours = `${lessonTime.minutes} ${
      lessonTime.hours - 2 < 0 ? lessonTime.hours + 22 : lessonTime.hours - 2
    } * * ${dayNumber}`;

    await this.cronJobService.createCronJobDb({
      cronJobInfo: {
        name: jobNameForDay,
        time: jobTimeForDay,
        lessonId: lesson.id,
        telegramId: lesson.group.telegramId,
      },
      lesson: lesson,
      type: 'day',
    });

    await this.cronJobService.createCronJobDb({
      cronJobInfo: {
        name: jobNameForTwoHours,
        time: jobTimeForTwoHours,
        lessonId: lesson.id,
        telegramId: lesson.group.telegramId,
      },
      lesson: lesson,
      type: 'hour',
    });

    return;
  }
}
