import { Ctx, Hears, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { LessonService } from '../../lesson/lesson.service';
import { Markup } from 'telegraf';

import { GroupService } from '../../group/group.service';
import { getLessonTypeRevert, getTimeObject } from '../../utils/functions';
import { BotScenes } from '../../utils/constants';

@Wizard(BotScenes.DeleteLessonScene)
export class DeleteLessonScene {
  constructor(
    private readonly lessonService: LessonService,
    private readonly groupService: GroupService,
  ) {}
  @WizardStep(1)
  async onGroupChoose(@Ctx() ctx: WizardContext) {
    try {
      const groupsDb = await this.groupService.getAllGroups();

      if (!groupsDb.length) {
        await ctx.scene.leave();
        return 'Нет ни одной группы. Сначала нужно добавить группы';
      }

      await ctx.wizard.next();
      await ctx
        .reply(
          'Удаление занятий со старым расписанием. Для отмены набери "выход". Выбери группу для создания урока (Не забудь заранее добавить нужную группу в БД)',
          Markup.inlineKeyboard(
            groupsDb.map(item =>
              Markup.button.callback(
                item.name,
                `${item.name.slice(0, 15)}|${item.id}`,
              ),
            ),
            {
              columns: 1,
            },
          ),
        )
        .then(({ message_id }) => {
          setTimeout(async () => {
            try {
              await ctx.deleteMessage(message_id);
            } catch (error) {
              console.log(error.message);
            }
          }, 10000);
        });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(2)
  async onLessonChoose(
    @Ctx()
    ctx: WizardContext & {
      wizard: {
        state: {
          groupInfo: string;
        };
      };
    },
  ) {
    try {
      ctx.wizard.state.groupInfo = ctx.callbackQuery['data'];
      const lessons = await this.lessonService.getByGroupId(
        +ctx.wizard.state.groupInfo.split('|')[1],
      );
      await ctx.wizard.next();
      await ctx
        .reply(
          'Отлично! Выбери нужный урок:',
          Markup.inlineKeyboard(
            lessons.map(lesson => {
              const lessonTime = getTimeObject(lesson.time);
              return Markup.button.callback(
                `${lesson.day}, ${lessonTime.hours}:${
                  lessonTime.minutes === 0 ? '00' : lessonTime.minutes
                } - ${getLessonTypeRevert(lesson.type)}`,
                `${lesson.day}, ${lessonTime.hours}:${
                  lessonTime.minutes === 0 ? '00' : lessonTime.minutes
                }|${lesson.id}`,
              );
            }),
            {
              columns: 1,
            },
          ),
        )
        .then(({ message_id }) => {
          setTimeout(async () => {
            try {
              await ctx.deleteMessage(message_id);
            } catch (error) {
              console.log(error.message);
            }
          }, 10000);
        });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(3)
  async onLessonChooseConfirm(
    @Ctx()
    ctx: WizardContext & {
      wizard: {
        state: {
          lessonInfo: string;
        };
      };
    },
  ) {
    try {
      ctx.wizard.state.lessonInfo = ctx.callbackQuery['data'];
      const lessonInfo = ctx.wizard.state.lessonInfo;
      await ctx.wizard.next();
      await ctx
        .reply(
          `Вы выбрали урок ${lessonInfo.split('|')[0]}. Вы уверены?`,
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
          setTimeout(async () => {
            try {
              await ctx.deleteMessage(message_id);
            } catch (error) {
              console.log(error.message);
            }
          }, 10000);
        });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(4)
  async onLessonDeleteFinish(
    @Ctx()
    ctx: WizardContext & {
      wizard: {
        state: {
          lessonInfo: string;
        };
      };
    },
  ) {
    try {
      if (ctx.callbackQuery['data'] === 'no') {
        await ctx.scene.reenter();
        return;
        // await ctx.wizard.selectStep(1);
        // //@ts-ignore
        // return ctx.wizard.steps[ctx.wizard.cursor](ctx);
        // // return;
      }

      const lessonInfo = ctx.wizard.state.lessonInfo;
      await ctx.scene.leave();
      await this.lessonService.removeLesson(+lessonInfo.split('|')[1]);
      await ctx
        .reply(`Удален урок "${lessonInfo.split('|')[0]}"`)
        .then(({ message_id }) => {
          setTimeout(async () => {
            try {
              await ctx.deleteMessage(message_id);
            } catch (error) {
              console.log(error.message);
            }
          }, 10000);
        });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @Hears('выход')
  async leaveScene(
    @Ctx()
    ctx: WizardContext,
  ) {
    try {
      await ctx.scene.leave();
      return 'Вы вышли из меню создания';
    } catch (err) {
      console.log(err.message);
    }
  }
}
