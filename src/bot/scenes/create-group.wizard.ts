import {
  Ctx,
  Hears,
  InjectBot,
  Message,
  On,
  Wizard,
  WizardStep,
} from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { LessonService } from '../../lesson/lesson.service';
import { Markup, Telegraf } from 'telegraf';
import { GroupService } from '../../group/group.service';
import { ContextInterface } from '../types/context.interface';
import { LevelEnum } from '@prisma/client';
import { changeGroupLevel } from '../../utils/functions';
import { BadRequestException } from '@nestjs/common';
import { BotScenes } from '../../utils/constants';

@Wizard(BotScenes.CreateGroupScene)
export class CreateGroupScene {
  constructor(
    private readonly lessonService: LessonService,
    private readonly groupService: GroupService,
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
  ) {}
  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    try {
      const groupInfo = await this.bot.telegram.getChat(ctx.chat.id);

      ctx.wizard.state['groupName'] = groupInfo['title'];
      ctx.wizard.state['groupTelegramId'] = groupInfo.id;

      const isGroupExist = await this.groupService.getGroupWhenCreate(
        groupInfo.id,
      );

      if (isGroupExist) {
        await ctx.scene.leave();
        await ctx
          .reply(`Группа "${groupInfo['title']}" уже создана.`)
          .then(({ message_id }) => {
            setTimeout(() => ctx.deleteMessage(message_id), 5000);
          });
        return;
      }

      await ctx.wizard.next();
      await ctx.reply(
        `Создана группа ${groupInfo['title']}! Теперь выбери уровень группы:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: changeGroupLevel(LevelEnum.START),
                  callback_data: LevelEnum.START,
                },
              ],
              [
                {
                  text: changeGroupLevel(LevelEnum.BASE),
                  callback_data: LevelEnum.BASE,
                },
              ],
              [
                {
                  text: changeGroupLevel(LevelEnum.INTERMEDIATE),
                  callback_data: LevelEnum.INTERMEDIATE,
                },
              ],
              [
                {
                  text: changeGroupLevel(LevelEnum.ADVANCED),
                  callback_data: LevelEnum.ADVANCED,
                },
              ],
            ],
          },
        },
      );
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(2)
  async onGroupLevelChoose(@Ctx() ctx: WizardContext) {
    try {
      ctx.wizard.state['groupLevel'] = ctx.callbackQuery['data'];
      await ctx.wizard.next();
      await ctx
        .reply(
          `Вы выбрали "${changeGroupLevel(
            ctx.wizard.state['groupLevel'],
          )}". Все верно?`,
          Markup.inlineKeyboard(
            [
              Markup.button.callback('Да', 'yes'),
              Markup.button.callback('Нет', 'no'),
            ],
            {
              columns: 1,
            },
          ),
        )
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 10000);
        });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(3)
  async onGroupCreateFinish(
    @Ctx()
    ctx: WizardContext & {
      wizard: {
        state: {
          groupName: string;
          groupLevel: LevelEnum;
          groupTelegramId: string;
        };
      };
    },
  ) {
    try {
      if (ctx.callbackQuery['data'] === 'no') {
        await ctx.scene.reenter();
        return;
      }

      const newGroup = await this.groupService.createGroup({
        name: ctx.wizard.state.groupName,
        telegramId: +ctx.wizard.state.groupTelegramId,
        level: ctx.wizard.state.groupLevel,
      });

      await ctx.scene.leave();
      await ctx
        .reply(
          `Создана группа ${newGroup.name}. ${changeGroupLevel(
            newGroup.level,
          )} уровень.`,
        )
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 5000);
        });
      return;
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  @Hears(['выход', 'Выход'])
  async leaveScene(
    @Ctx()
    ctx: WizardContext,
    @Message('text') msg: string,
  ) {
    try {
      await ctx.scene.leave();
      return 'Вы вышли из меню создания';
    } catch (err) {
      console.log(err.message);
    }
  }
}
