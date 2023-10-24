import { AppService } from '../app.service';
import {
  Action,
  Command,
  Ctx,
  Hears,
  Help,
  InjectBot,
  Message,
  On,
  Sender,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { actionButtons } from './bot.buttons';
import {
  ContextInterface,
  SceneContextInterface,
} from './types/context.interface';
import { UserService } from '../user/user.service';
import { adminOptions, userOptions } from './options';
import { GroupService } from '../group/group.service';
import { UseFilters, UseGuards } from '@nestjs/common';

import { TelegrafExceptionFilter } from './filters/telegraf-exception.filter';
import { AdminGuard } from './guards/admin.guard';

import { CreateUserDto } from '../user/dto/create-user.dto';
import { LessonService } from '../lesson/lesson.service';
import { CronJobService } from '../cron-job/cron-job.service';
import { toHoursAndMinutes } from '../utils/functions';

@Update()
@UseFilters(TelegrafExceptionFilter)
export class BotUpdate {
  constructor(
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly lessonService: LessonService,
    private readonly cronJobService: CronJobService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: ContextInterface, @Sender() sender: any) {
    try {
      await this.bot.telegram.setMyCommands([
        { command: '/start', description: 'Начало работы' },
        { command: '/admin', description: 'Функции администратора' },
        {
          command: '/get_schedule',
          description: 'Получить расписание',
        },
      ]);

      return `Приветствую Всех в нашей группе!. Здесь есть бот, который поможет тебе узнать текущее расписание занятий. (p.s. у меня еще есть косяки, нахожусь в процессе устранения:)`;
      // await ctx.reply('Приветствую в нашей группе!)');
    } catch (err) {
      console.log(err);
    }
  }

  @Help()
  async help(@Ctx() ctx: ContextInterface) {
    console.log(ctx.message);
  }

  // Lessons logic =================================================================

  @Action('createGroupSchedule')
  async createLessonScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter('createLessonScene');
  }

  @Action('updateSchedule')
  async updateLessonScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter('updateLessonScene');
  }

  // Actions =================================================================

  @UseGuards(AdminGuard)
  @Command('admin')
  async showAdmin(@Ctx() ctx: ContextInterface) {
    await ctx.deleteMessage(ctx.message.message_id);
    await ctx.reply('Что ты хочешь сделать?', actionButtons());
    return;
  }

  @UseGuards(AdminGuard)
  @Action('getCronJobs')
  async getCronJobs(@Ctx() ctx: ContextInterface) {
    const jobs = await this.cronJobService.getCronJobsForGroup();

    return jobs;
  }

  @Action('createGroup')
  async createGroup(@Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.bot.telegram.getChat(ctx.chat.id);
      const newGroup = await this.groupService.create({
        //@ts-ignore
        name: groupInfo.title,
        telegramId: groupInfo.id,
      });
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      await ctx
        .reply(`Создана группа ${newGroup.name}`)
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
      return;
      // await ctx.reply(`Создана группа ${newGroup.name}`);
    } catch (err) {
      console.log(err.message);
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      return err.message;
    }
  }

  @Command('get_schedule')
  async getSchedule(@Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.groupService.getByTelegramId(ctx.chat.id);
      const isAdmin = await this.isAdmin(ctx.chat.id, ctx.from.id, ctx);

      const lessons = await this.lessonService.getByGroupId(groupInfo.id);
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx
        .replyWithHTML(
          `
      <b>Твое расписание: </b>
      ${
        lessons.length > 0
          ? lessons.map(lesson => {
              const lessonTime = toHoursAndMinutes(lesson.time);
              return `<i> - ${lesson.day} ${lessonTime.hours}:${lessonTime.minutes}</i> \n`;
            })
          : 'Пока занятий нет'
      }`,
        )
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
    } catch (err) {
      console.log(err.message);
    }
  }

  @UseGuards(AdminGuard)
  @Action('get_schedule')
  async getScheduleAdmin(@Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.groupService.getByTelegramId(ctx.chat.id);
      const isAdmin = await this.isAdmin(ctx.chat.id, ctx.from.id, ctx);

      const lessons = await this.lessonService.getByGroupId(groupInfo.id);
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      await ctx
        .replyWithHTML(
          `
      <b>Твое расписание: </b>
      ${
        lessons.length > 0
          ? lessons.map(lesson => {
              const lessonTime = toHoursAndMinutes(lesson.time);
              return `<i> - ${lesson.day} ${lessonTime.hours}:${
                lessonTime.minutes
              }, ${isAdmin ? `уведомления: ${lesson.isEnable}` : ''}</i> \n`;
            })
          : 'Пока занятий нет'
      }`,
        )
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
    } catch (err) {
      console.log(err.message);
    }
  }

  @Action('shareInfo')
  async shareInfo(@Sender() sender: any, @Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.groupService.getByTelegramId(ctx.chat.id);

      const addUser: CreateUserDto = {
        firstName: ctx.callbackQuery.from.first_name || 'empty',
        lastName: ctx.callbackQuery.from.last_name || 'empty',
        userName: ctx.callbackQuery.from.username || 'empty',
        telegramId: ctx.callbackQuery.from.id,
        isAdmin: true,
        groupId: groupInfo.id,
      };

      const newUser = await this.userService.create({
        firstName: addUser.firstName,
        lastName: addUser.lastName,
        userName: addUser.userName,
        telegramId: addUser.telegramId,
        isAdmin: addUser.isAdmin,
        groupId: addUser.groupId,
      });

      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      return `В БД добавлен пользователь ${newUser.userName}`;
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  @Action('addAdminGroup')
  async toggleAdminGroup(@Ctx() ctx: ContextInterface) {
    const group = await this.groupService.getByTelegramId(ctx.chat.id);

    const result = await this.userService.toggleGroup(
      ctx.callbackQuery.from.id,
      group.id,
    );

    if (result) {
      await ctx.reply(`Группа ${group.name} добавлена к данным админа`);
      return;
    }

    await ctx.reply(`Группа ${group.name} удалена из данных админа`);
    return;
  }

  //  Private methods =================================================================

  @On('new_chat_members')
  async addUser(
    @Ctx()
    ctx: ContextInterface & {
      message: {
        new_chat_participant: {
          first_name: string;
          last_name: string;
          username: string;
          id: number;
        };
      };
    },
  ) {
    const group = await this.groupService.getByTelegramId(ctx.chat.id);

    const addUser: any = {
      firstName: ctx.message.new_chat_participant.first_name || 'empty',
      lastName: ctx.message.new_chat_participant.last_name || 'empty',
      userName: ctx.message.new_chat_participant.username,
      telegramId: ctx.message.new_chat_participant.id,
      isAdmin: false,
      groupId: group.id,
    };

    const _user = await this.userService.getByTelegramId(addUser.telegramId);

    if (_user) {
      await ctx.reply(
        `Данный пользователь "${_user.userName}" уже добавлен в БД.`,
      );
      return;
    }

    const newUser = await this.userService.create({
      firstName: addUser.firstName,
      lastName: addUser.lastName,
      userName: addUser.userName,
      telegramId: addUser.telegramId,
      isAdmin: addUser.isAdmin,
      groupId: addUser.groupId,
    });

    await ctx.reply(`Данный пользователь "${newUser.userName}" добавлен в БД.`);

    return;
  }

  // Добавление / удаление пользователей из БД =================================================================

  @On('left_chat_member')
  async deleteUser(
    @Ctx()
    ctx: ContextInterface & {
      message: {
        left_chat_member: {
          id: number;
        };
      };
    },
  ) {
    const _user = await this.userService.getByTelegramId(
      ctx.message.left_chat_member.id,
    );

    if (!_user) return;

    const deletedUser = await this.userService.remove(
      ctx.message.left_chat_member.id,
    );

    return;
  }

  private async isAdmin(chatId: number, userId: number, ctx: ContextInterface) {
    return new Promise((resolve, reject) => {
      ctx.telegram
        .getChatMember(chatId, userId)
        .then(user => {
          resolve(user.status === 'administrator' || user.status === 'creator');
        })
        .catch(error => reject(error));
    });
  }
}
