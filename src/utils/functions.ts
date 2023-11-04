import { DayEnum } from '../types';
import { LevelEnum } from '@prisma/client';

export const changeDayForCronJobs = (day: string) => {
  switch (day) {
    case DayEnum.MONDAY:
      return 1;
    case DayEnum.TUESDAY:
      return 2;
    case DayEnum.WEDNESDAY:
      return 3;
    case DayEnum.THURSDAY:
      return 4;
    case DayEnum.FRIDAY:
      return 5;
    case DayEnum.SATURDAY:
      return 6;
  }
};

export const changeGroupLevel = (level: LevelEnum) => {
  switch (level) {
    case LevelEnum.START:
      return 'Начальный';
    case LevelEnum.BASE:
      return 'Базовый';
    case LevelEnum.INTERMEDIATE:
      return 'Средний';
    case LevelEnum.ADVANCED:
      return 'Продвинутый';
  }
};

export const toHoursAndMinutes = (totalMinutes: number) => {
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return { hours, minutes };
};
