import { Ctx, Hears, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { LessonService } from '../../lesson/lesson.service';
import { Markup } from 'telegraf';
import { DayEnum } from '../../types';
import { GroupService } from '../../group/group.service';

@Wizard('createLessonScene')
export class CreateLessonScene {
  constructor(
    private readonly lessonService: LessonService,
    private readonly groupService: GroupService,
  ) {}
  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    try {
      const groupsDb = await this.groupService.getAll();

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
              `${item.name.slice(0, 15)}|${item.id}`,
            ),
          ),
          {
            columns: 1,
          },
        ),
      );
      return;
    } catch (err) {
      console.log(err);
    }
  }

  @On('callback_query')
  @WizardStep(2)
  async onGroupChoose(@Ctx() ctx: WizardContext) {
    try {
      ctx.wizard.state['groupInfo'] = ctx.callbackQuery['data'];
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
          ],
        },
      });
      return;
    } catch (err) {
      console.log(err);
      return err.message;
    }
  }

  @On('callback_query')
  @WizardStep(3)
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
  @WizardStep(4)
  async onHourCreate(@Ctx() ctx: WizardContext, @Message('text') msg: any) {
    try {
      if (!+msg) return 'Это не число. Попробуй еще раз';
      ctx.wizard.state['hour'] = +msg;
      await ctx.wizard.next();
      return 'Отлично! Теперь выбери минуты';
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  @On('text')
  @WizardStep(5)
  async onMinutesCreate(@Ctx() ctx: WizardContext, @Message('text') msg: any) {
    try {
      const regexp = /^[0-9]+$/;
      if (!regexp.test(msg)) return 'Это не число. Попробуй еще раз';
      ctx.wizard.state['minutes'] = msg;
      await ctx.wizard.next();
      return 'Почти готово! По умолчанию установлена продолжительность урока: 90 минут. Отправь "Пробел" для продолжения или новое время в минутах';
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  @On('text')
  @WizardStep(6)
  async onDurationCreate(@Ctx() ctx: WizardContext, @Message('text') msg: any) {
    try {
      const regexp = /^[0-9]+$/;
      if (!regexp.test(msg)) return 'Это не число. Попробуй еще раз';
      ctx.wizard.state['duration'] = msg;
      await ctx.wizard.next();
      await ctx.reply('Почти готово! Подключить уведомления?', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'да', callback_data: 'true' },
              { text: 'нет', callback_data: 'false' },
            ],
          ],
        },
      });
      return;
    } catch (err) {
      console.log(err.message);
      return err.message;
    }
  }

  @On('callback_query')
  @WizardStep(7)
  async onLessonCreateFinish(
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
        };
      };
    },
  ) {
    try {
      ctx.wizard.state['isEnable'] = JSON.parse(ctx.callbackQuery['data']);
      await ctx.scene.leave();
      await this.lessonService.create({
        day: ctx.wizard.state.day,
        time: +ctx.wizard.state.hour * 60 + +ctx.wizard.state.minutes,
        isEnable: ctx.wizard.state.isEnable,
        duration: !!ctx.wizard.state.duration ? +ctx.wizard.state.duration : 90,
        groupId: +ctx.wizard.state.groupInfo.split('|')[1],
      });

      return `Создан урок для группы "${
        ctx.wizard.state.groupInfo.split('|')[0]
      }" в ${ctx.wizard.state.day}, ${ctx.wizard.state.hour}:${
        ctx.wizard.state.minutes
      }, Продолжительность урока: ${
        !!ctx.wizard.state.duration ? +ctx.wizard.state.duration : 90
      } минут`;
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
    await ctx.scene.leave();
    return 'Вы вышли из меню создания';
  }
}
