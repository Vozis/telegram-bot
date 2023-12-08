import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PrismaService } from '../prisma.service';
import { CronJobType } from '@prisma/client';
import {
  changeDayForCronJobs,
  getDayByNumber,
  getTimeObject,
} from '../utils/functions';
import { CronJobService } from '../cron-job/cron-job.service';
import {
  LessonObj,
  LessonScheduleObject,
  LessonSelect,
  lessonSelectObj,
} from './lesson.type';
import { SheetService } from '../sheet/sheet.service';
import { sheetTitlesRange } from '../utils/constants';
import slugify from 'slugify';
import { GroupService } from '../group/group.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LessonService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cronJobService: CronJobService,
    private readonly sheetService: SheetService,
    private readonly groupService: GroupService,
  ) {}
  async createLesson(createLessonDto: CreateLessonDto): Promise<LessonSelect> {
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

    const groupIndex = await this.sheetService.findIndex(newLesson.group.name);
    await this.sheetService.writeToSheet(
      'Расписание',
      groupIndex,
      newLesson.day,
      {
        name: newLesson.name,
        time: newLesson.time,
        duration: newLesson.duration,
      },
    );

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

  async updateLesson(
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

    const lessonCronJobs =
      await this.cronJobService.getCronJobsForLessonFromDb(id);
    lessonCronJobs.forEach(async item => {
      await this.cronJobService.deleteCronJobFromCronSchedule(item.name);
      console.log(`Удалено уведомление ${item.name}`);
    });
    await this.cronJobService.deleteByLessonIdFromDb(id);

    if (!updatedLesson.isEnable) return updatedLesson;

    await this.createCronJobs(updatedLesson);

    return updatedLesson;
  }

  async removeLesson(id: number) {
    const lessonCronJobs =
      await this.cronJobService.getCronJobsForLessonFromDb(id);

    lessonCronJobs.forEach(async item => {
      await this.cronJobService.deleteCronJobFromCronSchedule(item.name);
      console.log(`Удалено уведомление ${item.name}`);
    });

    const lesson = await this.prismaService.lesson.delete({
      where: {
        id,
      },
      select: lessonSelectObj,
    });

    const groupIndex = await this.sheetService.findIndex(lesson.group.name);
    await this.sheetService.writeToSheet('Расписание', groupIndex, lesson.day, {
      name: '',
      time: '',
      duration: '',
    });

    return lesson;
  }

  async getFromGoogleSheet() {
    console.log('Получение расписания из таблицы');
    const { lastIndex } = await this.sheetService.getRangeSize();

    const data: string[][] = await this.sheetService.readRangeFromSheet(
      'Расписание',
      `Расписание!${sheetTitlesRange[0]}1:${sheetTitlesRange[lastIndex - 1]}22`,
    );

    const obj: LessonScheduleObject = {};

    for (let i = 0; i < data[0].length; i++) {
      for (let j = 0; j < data.length - 3; j += 3) {
        if (!obj[data[0][i]]) {
          obj[data[0][i]] = [];
          obj[data[0][i]].push({
            name: data[j + 1][i],
            time: data[j + 2][i],
            duration: +data[j + 3][i],
          });
        } else {
          obj[data[0][i]].push({
            name: data[j + 1][i],
            time: data[j + 2][i],
            duration: +data[j + 3][i],
          });
        }
      }
    }

    // console.log('full obj: ', obj);

    for (const item of Object.entries(obj)) {
      // console.log('item of full obj: ', item);
      await this.checkGoogleSchedule(item);
    }

    await console.log('Обновление расписания завершено');
    return 'Обновление расписания завершено';
  }

  async checkGoogleSchedule(item: [string, LessonObj[]]) {
    const slugName = slugify(item[0], {
      locale: 'en',
      lower: true,
    });

    const _group = await this.groupService.getBySlug(slugName);
    // const existedLessons = await this.getByGroupId(_group.id);

    let index = 1;
    for (const lesson of item[1]) {
      // console.log(index, lesson);
      const day = getDayByNumber(index);
      if (!lesson.time) {
        // console.log('groupId deleted lesson: ', _group.id);
        // console.log('day deleted lesson: ', day);
        const deletedLesson = await this.prismaService.lesson.findFirst({
          where: {
            AND: [
              {
                groupId: _group.id,
              },
              {
                day,
              },
            ],
          },
        });
        // console.log('deleted Lesson: ' + JSON.stringify(deletedLesson));
        if (deletedLesson) await this.removeLesson(deletedLesson.id);
        index++;
        continue;
      }

      const _lesson = await this.prismaService.lesson.findFirst({
        where: {
          groupId: _group.id,
          day,
        },
      });

      if (_lesson) {
        // console.log(
        //   '_lesson: ',
        //   JSON.stringify({
        //     name: _lesson.name,
        //     time: _lesson.time,
        //     duration: _lesson.duration,
        //   }),
        // );
        //
        // console.log(
        //   'lesson: ',
        //   JSON.stringify({
        //     name: lesson.name,
        //     time: lesson.time,
        //     duration: lesson.duration,
        //   }),
        // );
        if (
          _lesson.name != lesson.name ||
          _lesson.duration != lesson.duration ||
          _lesson.time != lesson.time
        ) {
          // console.log('update lesson');
          await this.updateLesson(_lesson.id, {
            time: lesson.time,
            name: lesson.name,
            duration: +lesson.duration,
          });
        }
      } else {
        await this.createLesson({
          name: lesson.name,
          time: lesson.time,
          day: day,
          duration: +lesson.duration,
          isEnable: true,
          groupId: _group.id,
        });
      }
      // console.log('existedLesson', _lesson);
      index++;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkGoogleSheetSchedule() {
    await this.getFromGoogleSheet();

    console.log('Расписание синхронизировано с Google таблицами');
  }

  private async createCronJobs(lesson: LessonSelect) {
    const dayNumber = changeDayForCronJobs(lesson.day);
    const lessonTime = getTimeObject(lesson.time);

    const jobNameForDay = `${lesson.id}-${getDayByNumber(dayNumber - 1)}-${
      lesson.time
    }`;
    const jobNameForTwoHours = `${lesson.id}-${lesson.day}-${
      lessonTime.hours - 2
    }:${lessonTime.minutes}`;

    const jobTimeForDay = `${lessonTime.minutes} ${lessonTime.hours} * * ${
      dayNumber - 1
    }`;

    const jobTimeForTwoHours = `${lessonTime.minutes} ${
      lessonTime.hours - 2 < 0 ? lessonTime.hours + 22 : lessonTime.hours - 2
    } * * ${dayNumber}`;

    await this.cronJobService.createLessonCronJob({
      cronJobInfo: {
        name: jobNameForDay,
        time: jobTimeForDay,
        lessonId: lesson.id,
        telegramId: lesson.group.telegramId,
        type: CronJobType.LESSON,
        actions: [],
      },
      lesson: lesson,
      type: 'day',
    });

    await this.cronJobService.createLessonCronJob({
      cronJobInfo: {
        name: jobNameForTwoHours,
        time: jobTimeForTwoHours,
        lessonId: lesson.id,
        telegramId: lesson.group.telegramId,
        type: CronJobType.LESSON,
        actions: [],
      },
      lesson: lesson,
      type: 'hour',
    });

    return;
  }
}
