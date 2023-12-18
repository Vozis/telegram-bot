import {
  Composer,
  Ctx,
  Hears,
  Message,
  On,
  Wizard,
  WizardStep,
} from 'nestjs-telegraf';
import { LessonService } from '../../lesson/lesson.service';
import { GroupService } from '../../group/group.service';
import { WizardContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { getLessonTypeRevert, getTimeObject } from '../../utils/functions';
import { BotScenes } from '../../utils/constants';

@Wizard(BotScenes.GetLessonsScene)
export class GetLessonsScene {
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
      await ctx.reply(
        'Просмотр расписания. Для отмены набери "выход". Выбери группу:',
        Markup.inlineKeyboard(
          groupsDb.map(item =>
            Markup.button.callback(
              item.name,
              `${item.name.slice(0, 15)}...|${item.id}`,
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
  async onGetLessonFinish(
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
      await ctx.scene.leave();
      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      await ctx
        .replyWithHTML(
          `
      <b>Расписание для группы ${ctx.wizard.state.groupInfo.split('|')[0]}: </b>
      ${
        lessons.length > 0
          ? lessons.map(lesson => {
              const lessonTime = getTimeObject(lesson.time);
              return `\n - ${lesson.day}, ${lessonTime.hours}:${
                lessonTime.minutes === 0 ? '00' : lessonTime.minutes
              } - ${getLessonTypeRevert(lesson.type)}`;
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
