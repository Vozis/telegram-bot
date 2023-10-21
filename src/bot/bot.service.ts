import { AppService } from '../app.service';
import {
  Action,
  Ctx,
  Hears,
  Help,
  InjectBot,
  On,
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

@Update()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<ContextInterface>,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
  ) {}

  @Start()
  async startCommand(@Ctx() ctx: ContextInterface) {
    // await this.bot.telegram.setMyCommands([
    //   { command: '/start', description: 'Начало работы' },
    //   { command: '/info', description: 'Информация о возможностях бота' },
    //   {
    //     command: '/addUserToGroup',
    //     description: 'Добавить участников в группу',
    //   },
    // ]);

    const userIsAdmin = await this.isAdmin(
      ctx.chat.id,
      ctx.message.from.id,
      ctx,
    );

    console.log(userIsAdmin);
    await ctx.reply('Привет! Давай начнем!)');
    if (userIsAdmin) {
      await ctx.reply('Что ты хочешь сделать?', actionButtons());
    } else {
      // await this.bot.telegram.setMyCommands([
      //   { command: '/start', description: 'Начальное приветствие' },
      //   { command: '/info', description: 'Информация о возможностях бота' },
      // ]);
    }
    // const users = await this.getAllChatMembers(ctx.chat.id);
    // console.log('users: ', users);
  }

  @Action('list')
  async getAll(@Ctx() ctx: ContextInterface) {
    await ctx.reply('List todo');
  }

  // @Hears('/info')
  // async getInfo(@Ctx() ctx: Context) {
  //   console.log(ctx);
  // }

  @On('new_chat_members')
  async chatJoin(@Ctx() ctx: ContextInterface) {
    await ctx.reply('Привет всем');
    // console.log(ctx.message.chat);
    //     const user = await this.userService.create({
    // firstName: ctx.message.from.
    //     });
  }

  @On('message')
  async test(@Ctx() ctx: ContextInterface) {
    // console.log(ctx.chat);
    // await ctx.reply('Привет всем');
    const users = await this.getAllChatMembers(ctx.chat.id);
    // console.log('all users:', users);
  }

  @On('text')
  async answer() {}

  @Hears('/addAll')
  async addAllMembers() {}

  // Actions =================================================================

  @Action('createGroup')
  async createGroup(@Ctx() ctx: ContextInterface) {
    const groupInfo = await this.bot.telegram.getChat(ctx.chat.id);
    console.log(await this.bot.telegram.getChat(ctx.chat.id));
    const newGroup = await this.groupService.create({
      //@ts-ignore
      name: groupInfo.title,
      telegramId: groupInfo.id,
    });
    return ctx.reply(`Создана группа ${newGroup.name}`);
  }

  //  Private methods =================================================================

  private async getAllChatMembers(id: number) {
    return this.bot.telegram.getChat(id);
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
