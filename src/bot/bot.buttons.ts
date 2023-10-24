import { Markup } from 'telegraf';

export function actionButtons() {
  return Markup.inlineKeyboard([
    [{ text: 'Добавить группу в БД', callback_data: 'createGroup' }],
    [
      {
        text: 'Добавить расписание группы',
        callback_data: 'createGroupSchedule',
      },
    ],
    [{ text: 'Получить расписание для группы', callback_data: 'getSchedule' }],
    [
      {
        text: 'Изменить расписание для группы',
        callback_data: 'updateSchedule',
      },
    ],
    [
      {
        text: 'Получить все установленные уведомления',
        callback_data: 'getCronJobs',
      },
    ],
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
