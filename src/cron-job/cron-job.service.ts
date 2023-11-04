import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateCronJobDto } from './dto/create-cron-job.dto';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ContextInterface } from '../bot/types/context.interface';

import { CronJobSelect, cronJobSelectObj } from './cron-job-select.obj';

import { changeGroupLevel, toHoursAndMinutes } from '../utils/functions';
import { CreateCronJobForDb } from './cron-job.type';

@Injectable()
export class CronJobService implements OnModuleInit {
  constructor(
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
    private readonly prismaService: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    const dbJobs = await this.prismaService.cronJob.findMany();

    dbJobs.forEach(
      async dbJob =>
        await this.addCronJobToSchedule({
          name: dbJob.name,
          time: dbJob.time,
          lessonId: dbJob.lessonId,
          message: dbJob.message,
          telegramId: dbJob.groupId,
        }),
    );

    console.log('All cron jobs have been added');
  }

  async createCronJobDb(
    createCronJobDto: CreateCronJobForDb,
  ): Promise<CronJobSelect> {
    const lessonTimeStart = toHoursAndMinutes(createCronJobDto.lesson.time);
    const lessonTimeEnd = toHoursAndMinutes(
      createCronJobDto.lesson.time + createCronJobDto.lesson.duration,
    );
    const groupLevel = changeGroupLevel(createCronJobDto.lesson.group.level);

    const reminderText = `Уважаемые учащиеся, напоминаем, что ${
      createCronJobDto.type === 'day' ? 'завтра' : 'сегодня'
    } с ${lessonTimeStart.hours}:${
      lessonTimeStart.minutes === 0 ? '00' : lessonTimeStart.minutes
    } до ${lessonTimeEnd.hours}:${
      lessonTimeEnd.minutes === 0 ? '00' : lessonTimeEnd.minutes
    } пройдёт занятие по направлению “${
      createCronJobDto.lesson.name.split('.')[0]
    }. ${groupLevel} уровень.” на платформе Odin. Подключаемся за 10 минут до начала занятия!`;

    const newCronJob = await this.prismaService.cronJob.create({
      data: {
        name: createCronJobDto.cronJobInfo.name,
        time: createCronJobDto.cronJobInfo.time,
        lesson: {
          connect: {
            id: createCronJobDto.cronJobInfo.lessonId,
          },
        },
        message: reminderText,
        group: {
          connect: {
            telegramId: createCronJobDto.cronJobInfo.telegramId,
          },
        },
      },
      select: cronJobSelectObj,
    });

    await this.addCronJobToSchedule({
      name: newCronJob.name,
      time: newCronJob.time,
      lessonId: newCronJob.lessonId,
      message: reminderText,
      telegramId: createCronJobDto.cronJobInfo.telegramId,
    });

    return newCronJob;
  }

  async addCronJobToSchedule(data: CreateCronJobDto) {
    const job = new CronJob(
      data.time,
      () => {
        console.log(`Уведомление сработало "${data.message}!"`);
        this.bot.telegram.sendMessage(data.telegramId, data.message);
      },
      null,
      true,
      'Europe/Moscow',
    );
    this.schedulerRegistry.addCronJob(data.name, job);
    job.start();

    console.log(`Добавлена задача с уведомлением ${data.name}`);
  }

  async getCronJobs() {
    const jobs = await this.schedulerRegistry.getCronJobs();

    jobs.forEach((value, key, map) => {
      console.log('Value:', value.cronTime.source);
    });
  }

  async getCronJobsForLesson(lessonId: number) {
    const lessonsFromDb = await this.prismaService.cronJob.findMany({
      where: {
        lesson: {
          id: lessonId,
        },
      },
    });

    return lessonsFromDb;
  }

  async deleteCronJob(jobName: string) {
    await this.schedulerRegistry.deleteCronJob(jobName);

    return console.log(`Удалена задача с уведомлением ${jobName}`);

    // return this.prismaService.cronJob.delete({
    //   where: {
    //     name: jobName,
    //   },
    // });
  }

  async deleteByLesson(lessonId: number) {
    return this.prismaService.cronJob.deleteMany({
      where: {
        lessonId,
      },
    });
  }
}
