import { Markup } from 'telegraf';

export function actionButtons() {
  return Markup.inlineKeyboard([
    [{ text: 'Создать группу', callback_data: 'createGroup' }],
    [{ text: 'Дать инфу о себе', callback_data: 'shareInfo' }],
    [{ text: 'Добавить группу у админа', callback_data: 'addAdminGroup' }],
  ]);
}

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
