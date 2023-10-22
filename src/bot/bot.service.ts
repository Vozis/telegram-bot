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
import { Context, Telegraf } from 'telegraf';
import { actionButtons } from './bot.buttons';
import { ContextInterface } from './context.interface';
import { UserService } from '../users/user.service';
import { adminOptions, userOptions } from './options';
import { GroupService } from '../groups/group.service';
import { Chat } from 'telegraf/types';
import { BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserSelect } from '../users/user.type';

@Update()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<ContextInterface>,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
  ) {}

  @Start()
  async startCommand(@Ctx() ctx: ContextInterface) {
    await this.bot.telegram.setMyCommands([
      { command: '/start', description: 'Начало работы' },
      { command: '/admin', description: 'Функции администратора' },
    ]);

    await ctx.reply('Приветствую в нашей группе!)');
  }

  @Help()
  async help(@Ctx() ctx: ContextInterface) {
    console.log(ctx);
  }

  // Добавление / удаление пользователей из БД =================================================================
  @On('new_chat_members')
  async addUser(@Ctx() ctx: ContextInterface) {
    const group = await this.groupService.getByTelegramId(ctx.chat.id);

    const addUser: Omit<User, 'id'> = {
      //@ts-ignore
      firstName: ctx.message.new_chat_member.first_name || 'empty',
      //@ts-ignore
      lastName: ctx.message.new_chat_member.last_name || 'empty',
      //@ts-ignore
      userName: ctx.message.new_chat_member.username,
      //@ts-ignore
      telegramId: ctx.message.new_chat_member.id,
      isAdmin: false,
      groupId: group.id,
    };

    const _user = await this.userService.getByTelegramId(addUser.telegramId);

    if (_user) {
      return ctx.reply(
        `Данный пользователь "${_user.userName}" уже добавлен в БД.`,
      );
    }

    // console.log('newUser: ', addUser);

    await this.userService.create({
      firstName: addUser.firstName,
      lastName: addUser.lastName,
      userName: addUser.userName,
      telegramId: addUser.telegramId,
      isAdmin: addUser.isAdmin,
      groupId: addUser.groupId,
    });

    return;
  }

  @On('left_chat_member')
  async deleteUser(@Ctx() ctx: ContextInterface) {
    const deletedUser = await this.userService.remove(
      //@ts-ignore
      ctx.message.left_chat_member.id,
    );

    return;
  }

  // Actions =================================================================

  @Command('admin')
  async showAdmin(@Ctx() ctx: ContextInterface) {
    await ctx.deleteMessage(ctx.message.message_id);

    const userIsAdmin = await this.isAdmin(
      ctx.chat.id,
      ctx.message.from.id,
      ctx,
    );

    if (userIsAdmin) {
      await ctx.reply('Что ты хочешь сделать?', actionButtons());
    }
  }

  @Action('createGroup')
  async createGroup(@Ctx() ctx: ContextInterface) {
    const groupInfo = await this.bot.telegram.getChat(ctx.chat.id);

    const _group = await this.groupService.getByTelegramId(groupInfo.id);

    if (_group) {
      await ctx.reply(`группа "${_group.name}" уже создана.`);
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      return;
    }

    const newGroup = await this.groupService.create({
      //@ts-ignore
      name: groupInfo.title,
      telegramId: groupInfo.id,
    });

    // return ctx.reply(`Создана группа ${newGroup.name}`);
  }

  //  Private methods =================================================================

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
