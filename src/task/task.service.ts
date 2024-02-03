import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CronJobService } from '../cron-job/cron-job.service';
import { CreateTaskCronJobForDb } from '../cron-job/cron-job.type';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SheetService } from '../sheet/sheet.service';

@Injectable()
export class TaskService implements OnModuleInit {
  startIndex = this.configService.get<string>('START_INDEX');
  endIndex = this.configService.get<string>('END_INDEX');

  constructor(
    private readonly sheetService: SheetService,
    private readonly configService: ConfigService,
    private readonly cronJobService: CronJobService,
  ) {}

  async onModuleInit() {
    // await this.getTasksFromGoogleSheet();

    console.log('Tasks from google sheet initialized');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkGoogleSheet() {
    await this.getTasksFromGoogleSheet();

    console.log('All tasks updated for the next week.');
  }

  async getTaskForGroupToday(groupId: number) {
    const d = new Date();
    const day = d.getDay();

    const task = await this.cronJobService.getByNameFromDb(`${groupId}-${day}`);

    if (!task) throw new BadRequestException('На сегодня задач нет');

    return task;
  }

  async getTasksFromGoogleSheet() {
    const googleSheets = await this.sheetService.readGoogleSheet();

    const googleSheetTitles = googleSheets.sheets
      .slice(1)
      .map(item => item.properties.title);

    for (const item of googleSheetTitles) {
      await this.saveTasksForWeek(item);

      // console.log(`data ${item}: `, data);
    }
  }

  async saveTasksForWeek(sheetName: string) {
    const tasks = [];
    const daysIndex = ['B', 'C', 'D', 'E', 'F', 'G'];

    for (const dayIndex of daysIndex) {
      await this.getTaskForDay(sheetName, dayIndex).then(task => {
        // if (!task.text) return;
        tasks.push(task);
      });
    }
    return tasks;
  }

  async getTaskForDay(sheetName: string, dayIndex: string) {
    const range = `${sheetName}!${dayIndex}${this.startIndex}:${dayIndex}${this.endIndex}`;
    const task = await this.sheetService.readRangeFromSheet(sheetName, range);

    const returnedData = task.map(item => item[0]);

    const taskObj: CreateTaskCronJobForDb = {
      day: returnedData[0] ? String(returnedData[0]).trim() : '',
      type: returnedData[1] ? String(returnedData[1]).trim() : '',
      text: returnedData[2] ? String(returnedData[2]).trim() : '',
      answer1: returnedData[3] ? String(returnedData[3]).trim() : '',
      answer2: returnedData[4] ? String(returnedData[4]).trim() : '',
      answer3: returnedData[5] ? String(returnedData[5]).trim() : '',
      answer4: returnedData[6] ? String(returnedData[6]).trim() : '',
      rightAnswer: returnedData[7] ? String(returnedData[7]).trim() : '',
      groupName: sheetName,
    };

    await this.cronJobService.createTaskCronJob(taskObj);

    return taskObj;
  }
}
