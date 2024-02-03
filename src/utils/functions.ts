import { DayEnum } from '../types';
import { LessonTypeEnum, LevelEnum } from '@prisma/client';

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
    case DayEnum.SUNDAY:
      return 7;
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

export const getTimeObject = (time: string) => {
  const hours = +time.split(':')[0];
  const minutes = +time.split(':')[1];

  return {
    hours,
    minutes,
  };
};

export function subtractHours(date: Date, hours: number) {
  const dateCopy = new Date(date);

  dateCopy.setHours(date.getHours() - hours);

  return dateCopy;
}

export function addMinutes(date: string, duration: number) {
  const addHours = Math.floor(duration / 60);
  const leftMinutes = duration - addHours * 60;
  const hours = +date.split(':')[0] + addHours;
  const minutes = +date.split(':')[1] + leftMinutes;

  return {
    hours,
    minutes,
  };
}

export const getDayByNumber = (dayNumber: number) => {
  switch (dayNumber) {
    case 1:
      return DayEnum.MONDAY;
    case 2:
      return DayEnum.TUESDAY;
    case 3:
      return DayEnum.WEDNESDAY;
    case 4:
      return DayEnum.THURSDAY;
    case 5:
      return DayEnum.FRIDAY;
    case 6:
      return DayEnum.SATURDAY;
    case 0:
      return DayEnum.SUNDAY;
    case 7:
      return DayEnum.SUNDAY;
  }
};

export const getLessonType = (type: string) => {
  const _type = type.toLowerCase();
  switch (_type) {
    case 'самостоятельная лекция':
      return LessonTypeEnum.LECTURE;
    case 'семинар':
      return LessonTypeEnum.SEMINAR;
  }
};

export const getLessonTypeRevert = (type: LessonTypeEnum) => {
  switch (type) {
    case 'LECTURE':
      return 'самостоятельная лекция';
    case 'SEMINAR':
      return 'семинар';
  }
};

export const getDayRowsIndexes = (day: string) => {
  switch (day) {
    case DayEnum.MONDAY:
      return {
        startIndex: 2,
        endIndex: 5,
      };
    case DayEnum.TUESDAY:
      return { startIndex: 6, endIndex: 9 };
    case DayEnum.WEDNESDAY:
      return { startIndex: 10, endIndex: 13 };
    case DayEnum.THURSDAY:
      return { startIndex: 14, endIndex: 17 };
    case DayEnum.FRIDAY:
      return { startIndex: 18, endIndex: 21 };
    case DayEnum.SATURDAY:
      return { startIndex: 22, endIndex: 25 };
    case DayEnum.SUNDAY:
      return { startIndex: 26, endIndex: 29 };
  }
};
