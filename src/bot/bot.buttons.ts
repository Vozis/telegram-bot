import { Markup, Telegraf } from 'telegraf';

export function actionButtons() {
  return Markup.inlineKeyboard([
    [{ text: 'Создать группу', callback_data: 'createGroup' }],
    [{ text: 'Добавить участников в БД', callback_data: 'addUsersToGroup' }],
  ]);
  // return Markup.keyboard(
  //   [
  //     Markup.button.callback('Список дел', 'list'),
  //     Markup.button.callback('Редактирование', 'edit'),
  //     Markup.button.callback('Удаление', 'delete'),
  //   ],
  //   {
  //     columns: 3,
  //   },
  // );
}
