import { Ctx, Hears, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { LessonService } from '../../lesson/lesson.service';
import { Markup } from 'telegraf';
import { DayEnum } from '../../types';
import { GroupService } from '../../group/group.service';
import { BotScenes } from '../../utils/constants';
import { LessonTypeEnum } from '@prisma/client';
import { getLessonTypeRevert } from '../../utils/functions';

@Wizard(BotScenes.CreateLessonScene)
export class CreateLessonScene {
  constructor(
    private readonly lessonService: LessonService,
    private readonly groupService: GroupService,
  ) {}
  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    try {
      const groupsDb = await this.groupService.getAllGroups();

      if (!groupsDb.length) {
        await ctx.scene.leave();
        return 'Нет ни одной группы. Сначала нужно добавить группы';
      }

      await ctx.wizard.next();
      await ctx.reply(
        'Начало создания урока. Для отмены набери "выход". Выбери группу для создания урока (Не забудь заранее добавить нужную группу в БД)',
        Markup.inlineKeyboard(
          groupsDb.map(item =>
            Markup.button.callback(
              item.name,
              `${item.name.slice(0, 35)}|${item.id}`,
            ),
          ),
          {
            columns: 1,
          },
        ),
      );
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(2)
  async onGroupChoose(@Ctx() ctx: WizardContext) {
    try {
      ctx.wizard.state['groupInfo'] = ctx.callbackQuery['data'];
      await ctx.wizard.next();
      await ctx.reply('Отлично! Теперь выбери тип занятия:', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Самостоятельная лекция',
                callback_data: LessonTypeEnum.LECTURE,
              },
            ],
            [{ text: 'Семинар', callback_data: LessonTypeEnum.SEMINAR }],
          ],
        },
      });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(3)
  async onLessonTypeChoose(@Ctx() ctx: WizardContext) {
    try {
      ctx.wizard.state['lessonType'] = ctx.callbackQuery['data'];
      const groupName = ctx.wizard.state['groupInfo'].split('|')[0];
      await ctx.wizard.next();
      await ctx.reply(
        'Отлично! Теперь введи название урока:',
        Markup.inlineKeyboard(
          [
            Markup.button.callback(
              groupName.split('.')[1]
                ? groupName.split('.')[1]
                : groupName.split('.')[0],
              groupName.split('.')[1]
                ? groupName.split('.')[1]
                : groupName.split('.')[0],
            ),
          ],
          {
            columns: 1,
          },
        ),
      );
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('text')
  @WizardStep(4)
  async onLessonNameCreateText(
    @Ctx() ctx: WizardContext,
    @Message('text') msg: string,
  ) {
    try {
      ctx.wizard.state['lessonName'] = msg;
      await ctx.wizard.next();
      await ctx.reply('Отлично! Теперь выбери день недели', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Понедельник', callback_data: DayEnum.MONDAY }],
            [{ text: 'Вторник', callback_data: DayEnum.TUESDAY }],
            [{ text: 'Среда', callback_data: DayEnum.WEDNESDAY }],
            [{ text: 'Четверг', callback_data: DayEnum.THURSDAY }],
            [{ text: 'Пятница', callback_data: DayEnum.FRIDAY }],
            [{ text: 'Суббота', callback_data: DayEnum.SATURDAY }],
            [{ text: 'Воскресенье', callback_data: DayEnum.SUNDAY }],
          ],
        },
      });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(4)
  async onLessonNameCreate(@Ctx() ctx: WizardContext) {
    try {
      ctx.wizard.state['lessonName'] = ctx.callbackQuery['data'];
      await ctx.wizard.next();
      await ctx.reply('Отлично! Теперь выбери день недели', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Понедельник', callback_data: DayEnum.MONDAY }],
            [{ text: 'Вторник', callback_data: DayEnum.TUESDAY }],
            [{ text: 'Среда', callback_data: DayEnum.WEDNESDAY }],
            [{ text: 'Четверг', callback_data: DayEnum.THURSDAY }],
            [{ text: 'Пятница', callback_data: DayEnum.FRIDAY }],
            [{ text: 'Суббота', callback_data: DayEnum.SATURDAY }],
            [{ text: 'Воскресенье', callback_data: DayEnum.SUNDAY }],
          ],
        },
      });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('callback_query')
  @WizardStep(5)
  async onDayCreate(@Ctx() ctx: WizardContext) {
    try {
      ctx.wizard.state['day'] = ctx.callbackQuery['data'];
      await ctx.wizard.next();
      return 'Отлично. Теперь выбери час';
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('text')
  @WizardStep(6)
  async onHourCreate(@Ctx() ctx: WizardContext, @Message('text') msg: any) {
    try {
      if (!+msg) return 'Это не число. Попробуй еще раз';
      if (+msg < 0 || +msg > 24)
        return 'Столько часов быть не может! Придется ввести заново';
      ctx.wizard.state['hour'] = +msg;
      await ctx.wizard.next();
      return 'Отлично! Теперь выбери минуты';
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('text')
  @WizardStep(7)
  async onMinutesCreate(@Ctx() ctx: WizardContext, @Message('text') msg: any) {
    try {
      const regexp = /^[0-9]+$/;
      if (!regexp.test(msg)) return 'Это не число. Попробуй еще раз';
      if (+msg < 0 || +msg > 59)
        return 'Столько минут быть не может! Придется ввести заново';
      ctx.wizard.state['minutes'] = msg;
      await ctx.wizard.next();
      return 'Почти готово! Теперь введи продолжительность урока. Для самостоятельной лекции можешь ввести любое число :)';
    } catch (err) {
      console.log(err.message);
    }
  }

  @On('text')
  @WizardStep(8)
  async onLessonCreateFinish(
    @Message('text') msg: any,
    @Ctx()
    ctx: WizardContext & {
      wizard: {
        state: {
          day: string;
          hour: string;
          minutes: string;
          isEnable: boolean;
          duration: number;
          groupInfo: string;
          lessonName: string;
          lessonType: LessonTypeEnum;
        };
      };
    },
  ) {
    try {
      const regexp = /^[0-9]+$/;
      if (!regexp.test(msg)) return 'Это не число. Попробуй еще раз';
      ctx.wizard.state['duration'] = msg;
      await ctx.scene.leave();
      await this.lessonService.createLesson('Расписание', {
        day: ctx.wizard.state.day,
        time: `${ctx.wizard.state.hour}:${ctx.wizard.state.minutes}`,
        name: ctx.wizard.state.lessonName,
        type: ctx.wizard.state.lessonType,
        isEnable: true,
        duration: !!ctx.wizard.state.duration ? +ctx.wizard.state.duration : 90,
        groupId: +ctx.wizard.state.groupInfo.split('|')[1],
      });

      return `Создан урок для группы "${
        ctx.wizard.state.groupInfo.split('|')[0]
      }" в ${ctx.wizard.state.day}, ${ctx.wizard.state.hour}:${
        ctx.wizard.state.minutes
      }, тип: ${getLessonTypeRevert(
        ctx.wizard.state.lessonType,
      )}, продолжительность урока: ${
        !!ctx.wizard.state.duration ? +ctx.wizard.state.duration : 90
      } минут`;
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  @Hears(['выход', 'Выход'])
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
