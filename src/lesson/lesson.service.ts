import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { PrismaService } from '../prisma.service';
import { CronJobType } from '@prisma/client';
import {
  changeDayForCronJobs,
  getDayByNumber,
  getLessonType,
  getLessonTypeRevert,
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
    try {
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
          name: createLessonDto.name.trim(),
          type: createLessonDto.type,
          isEnable: createLessonDto.isEnable,
          duration:
            createLessonDto.type === 'SEMINAR'
              ? createLessonDto.duration
              : null,
          group: {
            connect: {
              id: createLessonDto.groupId,
            },
          },
        },
        select: lessonSelectObj,
      });

      if (!newLesson.isEnable) return newLesson;

      const groupIndex = await this.sheetService.findIndex(
        newLesson.group.name,
      );
      await this.sheetService.writeLessonToSheet(
        'Расписание',
        groupIndex,
        newLesson.day,
        {
          name: newLesson.name,
          time: newLesson.time,
          duration: newLesson.duration ? newLesson.duration : '',
          type: getLessonTypeRevert(newLesson.type),
        },
      );

      await this.createCronJobs(newLesson);
      return newLesson;
    } catch (error) {
      console.log('createLesson error: ', error);
    }
  }

  async getByGroupId(groupId: number): Promise<LessonSelect[]> {
    try {
      return this.prismaService.lesson.findMany({
        where: {
          groupId: groupId,
        },
        select: lessonSelectObj,
      });
    } catch (error) {
      console.log('getByGroupId lesson error: ', error);
    }
  }

  async getFirstItem() {}

  async updateLesson(
    id: number,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonSelect> {
    try {
      // console.log('updateLessonDto: ', updateLessonDto);
      const updatedLesson = await this.prismaService.lesson.update({
        where: {
          id,
        },
        data: {
          day: updateLessonDto.day,
          time: updateLessonDto.time,
          name: updateLessonDto.name.trim(),
          type: updateLessonDto.type,
          duration:
            updateLessonDto.type === 'LECTURE'
              ? null
              : updateLessonDto.duration,
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
    } catch (error) {
      console.log('updateLesson error: ', error);
    }
  }

  async removeLesson(id: number) {
    try {
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
      await this.sheetService.writeLessonToSheet(
        'Расписание',
        groupIndex,
        lesson.day,
        {
          name: '',
          time: '',
          duration: '',
          type: '',
        },
      );

      return lesson;
    } catch (error) {
      console.log('removeLesson error: ', error);
    }
  }

  async getFromGoogleSheet() {
    try {
      console.log('Получение расписания из таблицы');
      const { lastIndex } = await this.sheetService.getRangeSize();

      const data: string[][] = await this.sheetService.readRangeFromSheet(
        'Расписание',
        `Расписание!${sheetTitlesRange[0]}1:${
          sheetTitlesRange[lastIndex - 1]
        }29`,
      );

      const obj: LessonScheduleObject = {};

      for (let i = 0; i < data[0].length; i++) {
        for (let j = 0; j < data.length - 4; j += 4) {
          if (!obj[data[0][i]]) {
            obj[data[0][i]] = [];
            obj[data[0][i]].push({
              name: data[j + 1][i],
              time: data[j + 2][i],
              duration: data[j + 3][i] ? +data[j + 3][i] : null,
              type: data[j + 4][i],
            });
          } else {
            obj[data[0][i]].push({
              name: data[j + 1][i],
              time: data[j + 2][i],
              duration: data[j + 3][i] ? +data[j + 3][i] : null,
              type: data[j + 4][i],
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
    } catch (error) {
      console.log('getFromGoogleSheet error: ', error);
    }
  }

  async checkGoogleSchedule(item: [string, LessonObj[]]) {
    try {
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
            AND: [
              {
                groupId: _group.id,
              },
              {
                day,
              },
            ],
          },
          select: lessonSelectObj,
        });

        if (_lesson) {
          if (
            _lesson.name != lesson.name.trim() ||
            _lesson.duration != lesson.duration ||
            _lesson.time != lesson.time ||
            _lesson.type != getLessonType(lesson.type)
          ) {
            // console.log(
            //   '_lesson: ',
            //   JSON.stringify({
            //     name: _lesson.name,
            //     time: _lesson.time,
            //     duration: _lesson.duration,
            //     type: _lesson.type,
            //   }),
            // );
            //
            // console.log(
            //   'lesson: ',
            //   JSON.stringify({
            //     name: lesson.name,
            //     time: lesson.time,
            //     duration: lesson.duration,
            //     type: getLessonType(lesson.type),
            //   }),
            // );
            await this.updateLesson(_lesson.id, {
              time: lesson.time,
              name: lesson.name.trim(),
              duration: +lesson.duration,
              type: getLessonType(lesson.type),
            });
          }
        } else {
          await this.createLesson({
            name: lesson.name,
            time: lesson.time,
            day: day,
            type: getLessonType(lesson.type),
            duration: +lesson.duration,
            isEnable: true,
            groupId: _group.id,
          });
        }
        // console.log('existedLesson', _lesson);
        index++;
      }
    } catch (error) {
      console.log('checkGoogleSchedule error: ', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkGoogleSheetSchedule() {
    await this.getFromGoogleSheet();

    console.log('Расписание синхронизировано с Google таблицами');
  }

  private async createCronJobs(lesson: LessonSelect) {
    try {
      const dayNumber = changeDayForCronJobs(lesson.day);
      const lessonTime = getTimeObject(lesson.time);

      switch (lesson.type) {
        case 'SEMINAR':
          const jobNameForDay = `${lesson.id}-${getDayByNumber(
            dayNumber - 1,
          )}-${lesson.time}`;
          const jobNameForTwoHours = `${lesson.id}-${lesson.day}-${
            lessonTime.hours - 2
          }:${lessonTime.minutes}`;

          const jobTimeForDay = `${lessonTime.minutes} ${
            lessonTime.hours
          } * * ${dayNumber - 1}`;

          const jobTimeForTwoHours = `${lessonTime.minutes} ${
            lessonTime.hours - 2 < 0
              ? lessonTime.hours + 22
              : lessonTime.hours - 2
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
          break;
        case 'LECTURE':
          const jobNameForLecture = `${lesson.id}-${getDayByNumber(
            dayNumber,
          )}-${lesson.time}`;

          const jobTimeForLecture = `${lessonTime.minutes} ${lessonTime.hours} * * ${dayNumber}`;

          await this.cronJobService.createLessonCronJob({
            cronJobInfo: {
              name: jobNameForLecture,
              time: jobTimeForLecture,
              lessonId: lesson.id,
              telegramId: lesson.group.telegramId,
              type: CronJobType.LESSON,
              actions: [],
            },
            lesson: lesson,
            type: 'hour',
          });
          break;
      }

      return;
    } catch (error) {
      console.log('createCronJobs error: ', error);
    }
  }
}
