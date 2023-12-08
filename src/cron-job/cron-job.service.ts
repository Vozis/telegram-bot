import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ContextInterface } from '../bot/types/context.interface';

import { CronJobSelect, cronJobSelectObj } from './cron-job-select.obj';

import {
  addMinutes,
  changeDayForCronJobs,
  changeGroupLevel,
  getTimeObject,
} from '../utils/functions';
import {
  CreateLessonCronJobForDb,
  CreateTaskCronJobForDb,
} from './cron-job.type';
import { CronJobType } from '@prisma/client';
import { GroupService } from '../group/group.service';
import slugify from 'slugify';

@Injectable()
export class CronJobService implements OnModuleInit {
  constructor(
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
    private readonly prismaService: PrismaService,
    private readonly groupService: GroupService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    const dbJobs = await this.prismaService.cronJob.findMany();

    dbJobs.forEach(
      async dbJob =>
        await this.addCronJobToCronSchedule({
          name: dbJob.name,
          time: dbJob.time,
          lessonId: dbJob.lessonId,
          message: dbJob.message,
          telegramId: dbJob.groupId,
          type: dbJob.type,
          actions: dbJob.actions,
        }),
    );

    console.log('All cron jobs have been added');
  }

  async createTaskCronJob(createTaskCronJobDto: CreateTaskCronJobForDb) {
    const taskText = `${createTaskCronJobDto.text}`;
    const reminderText = `Новая задачка на сегодня! ${taskText}`;
    const taskDay = changeDayForCronJobs(createTaskCronJobDto.day);
    const taskTime = `0 10 * * ${taskDay}`;
    const slugName = slugify(createTaskCronJobDto.groupName, {
      locale: 'en',
      lower: true,
    });

    const _group = await this.groupService.getBySlug(slugName);
    const taskCronName = `${_group.id}-${taskDay}`;
    const taskActions =
      createTaskCronJobDto.type === 'тест'
        ? [
            createTaskCronJobDto.answer1,
            createTaskCronJobDto.answer2,
            createTaskCronJobDto.answer3,
            createTaskCronJobDto.answer4,
          ]
        : [];

    const _cronJob = await this.getByNameFromDb(taskCronName);

    if (!_cronJob) {
      if (!taskText) return;
      return await this.createCronJobForDb({
        name: taskCronName,
        type: CronJobType.TASK,
        message: reminderText,
        actions: taskActions,
        time: taskTime,
        telegramId: _group.telegramId,
        groupName: _group.name,
        lessonId: null,
      });
    } else {
      await this.deleteCronJobFromCronSchedule(taskCronName);

      if (!taskText)
        return this.prismaService.cronJob.delete({
          where: {
            name: taskCronName,
          },
        });
      const updatedTaskCron = await this.prismaService.cronJob.update({
        where: {
          name: taskCronName,
        },
        data: {
          message: reminderText,
          actions: taskActions,
          time: taskTime,
        },
      });

      await this.addCronJobToCronSchedule({
        name: updatedTaskCron.name,
        time: updatedTaskCron.time,
        message: updatedTaskCron.message,
        telegramId: _group.telegramId,
        type: updatedTaskCron.type,
        actions: taskActions,
      });

      return updatedTaskCron;
    }
  }

  async createLessonCronJob(
    createLessonCronJobDto: CreateLessonCronJobForDb,
  ): Promise<CronJobSelect> {
    const lessonTimeStart = getTimeObject(createLessonCronJobDto.lesson.time);
    const lessonTimeEnd = addMinutes(createLessonCronJobDto.lesson.time, 90);
    const groupLevel = changeGroupLevel(
      createLessonCronJobDto.lesson.group.level,
    );

    const reminderText = `Уважаемые учащиеся, напоминаем, что ${
      createLessonCronJobDto.type === 'day' ? 'завтра' : 'сегодня'
    } с ${lessonTimeStart.hours}:${
      lessonTimeStart.minutes === 0 ? '00' : lessonTimeStart.minutes
    } до ${lessonTimeEnd.hours}:${
      lessonTimeEnd.minutes === 0 ? '00' : lessonTimeEnd.minutes
    } пройдёт занятие по направлению “${
      createLessonCronJobDto.lesson.name.split('.')[0]
    }. ${groupLevel} уровень.” на платформе Odin. Подключаемся за 10 минут до начала занятия!`;

    // console.log('reminderText: ', reminderText);

    const newCronJob = await this.createCronJobForDb({
      name: createLessonCronJobDto.cronJobInfo.name,
      time: createLessonCronJobDto.cronJobInfo.time,
      lessonId: createLessonCronJobDto.cronJobInfo.lessonId,
      telegramId: createLessonCronJobDto.cronJobInfo.telegramId,
      message: reminderText,
      type: CronJobType.LESSON,
      actions: createLessonCronJobDto.cronJobInfo.actions,
    });

    return newCronJob;
  }

  async addCronJobToCronSchedule(data: CreateCronJobDto) {
    const job = new CronJob(
      data.time,
      () => {
        console.log(`Уведомление сработало "${data.message}!"`);
        switch (data.type) {
          case 'LESSON':
            this.bot.telegram.sendMessage(data.telegramId, data.message);
            break;
          case 'TASK':
            this.bot.telegram.sendMessage(data.telegramId, data.message);
            break;
        }
      },
      null,
      true,
      'Europe/Moscow',
    );
    this.schedulerRegistry.addCronJob(data.name, job);
    job.start();

    console.log(`Добавлена задача с уведомлением ${data.name}`);
  }

  async getByNameFromDb(name: string) {
    const _cronJob = await this.prismaService.cronJob.findUnique({
      where: {
        name,
      },
      select: cronJobSelectObj,
    });

    return _cronJob ? _cronJob : null;
  }

  async getCronJobsFromCronSchedule() {
    const jobs = await this.schedulerRegistry.getCronJobs();

    jobs.forEach((value, key, map) => {
      console.log('Value:', value.cronTime.source);
    });
  }

  async getCronJobsForLessonFromDb(lessonId: number) {
    const lessonsFromDb = await this.prismaService.cronJob.findMany({
      where: {
        lesson: {
          id: lessonId,
        },
      },
    });

    return lessonsFromDb;
  }

  async deleteCronJobFromCronSchedule(jobName: string) {
    await this.schedulerRegistry.deleteCronJob(jobName);

    return console.log(`Удалена задача с уведомлением ${jobName}`);
  }

  async deleteByLessonIdFromDb(lessonId: number) {
    return this.prismaService.cronJob.deleteMany({
      where: {
        lessonId,
      },
    });
  }

  private async createCronJobForDb(
    createCronJobDto: CreateCronJobDto,
  ): Promise<CronJobSelect> {
    const newCronJob = await this.prismaService.cronJob.create({
      data: {
        name: createCronJobDto.name,
        time: createCronJobDto.time,
        type: createCronJobDto.type,
        actions: createCronJobDto.actions,
        lesson: createCronJobDto.lessonId
          ? {
              connect: {
                id: createCronJobDto.lessonId,
              },
            }
          : {},
        message: createCronJobDto.message,
        group: {
          connect: {
            telegramId: createCronJobDto.telegramId,
          },
        },
      },
      select: cronJobSelectObj,
    });

    await this.addCronJobToCronSchedule({
      name: newCronJob.name,
      time: newCronJob.time,
      lessonId: newCronJob.lessonId,
      message: newCronJob.message,
      telegramId: createCronJobDto.telegramId,
      type: newCronJob.type,
      actions: createCronJobDto.actions,
    });

    return newCronJob;
  }
}
