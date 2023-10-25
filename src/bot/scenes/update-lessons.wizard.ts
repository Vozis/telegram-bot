import { Ctx, Hears, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { LessonService } from '../../lesson/lesson.service';
import { Markup } from 'telegraf';

import { GroupService } from '../../group/group.service';
import { toHoursAndMinutes } from '../../utils/functions';

@Wizard('updateLessonScene')
export class UpdateLessonScene {
  constructor(
    private readonly lessonService: LessonService,
    private readonly groupService: GroupService,
  ) {}
  @WizardStep(1)
  async onGroupChoose(@Ctx() ctx: WizardContext) {
    try {
      const groupsDb = await this.groupService.getAll();

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
          setTimeout(() => ctx.deleteMessage(message_id), 10000);
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
            lessons.map(item => {
              const lessonTime = toHoursAndMinutes(item.time);

              return Markup.button.callback(
                `${item.day},${lessonTime.hours}:${lessonTime.minutes}`,
                `${item.day},${lessonTime.hours}:${lessonTime.minutes}|${item.id}`,
              );
            }),
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
          setTimeout(() => ctx.deleteMessage(message_id), 10000);
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
      const lessonInfo = ctx.wizard.state.lessonInfo;
      await ctx.scene.leave();
      await this.lessonService.remove(+lessonInfo.split('|')[1]);
      await ctx
        .reply(`Удален урок "${lessonInfo.split('|')[0]}"`)
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 10000);
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
