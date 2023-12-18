import { Injectable, OnModuleInit } from '@nestjs/common';
import { GoogleSheetConnectorService } from 'nest-google-sheet-connector-modify';
import { ConfigService } from '@nestjs/config';
import { sheetTitlesRange } from '../utils/constants';
import { getDayRowsIndexes } from '../utils/functions';

@Injectable()
export class SheetService implements OnModuleInit {
  googleSheetId = this.configService.get<string>('GOOGLE_SHEET_ID');
  constructor(
    private readonly googleSheetConnectorService: GoogleSheetConnectorService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.readGoogleSheet();
    console.log('Tasks from google sheet initialized');
  }

  async readGoogleSheet() {
    return await this.googleSheetConnectorService.loadSpreadSheet(
      this.googleSheetId,
    );
  }

  async readRangeFromSheet(sheetName: string, range: string) {
    await this.googleSheetConnectorService.loadSpreadSheet(this.googleSheetId);

    return await this.googleSheetConnectorService.readRangeFromLoadedSpreadSheet(
      sheetName,
      range,
    );
  }

  // mapRowsToObjectList(rows: string[][]): object[] {
  //   const [keys, ...values] = rows;
  //   return values.map(valuesArr => {
  //     return valuesArr.reduce((obj, value, index) => {
  //       obj[keys[index]] = value;
  //       return obj;
  //     }, {});
  //   });
  // }

  // mapRowsToObjectList2(rows: string[][]): object[] {
  //   const [keys, ...values] = rows;
  //   return values.map(valuesArr => {
  //     console.log('valueArr:', valuesArr);
  //     return valuesArr.reduce((obj, value, index) => {
  //       obj[keys[index]] = value;
  //       return obj;
  //     }, {});
  //   });
  // }

  /**
   * Converts an Objet to a Google Sheet Row
   * @param object - any object
   * @returns Row
   */
  mapObjectToRow(object: object): string[] {
    return Object.values(object);
  }

  async findIndex(
    searchText: string,
    sheetName: string = 'Расписание',
    rowIndex: number = 1,
  ) {
    let i = 0;
    let string;
    do {
      try {
        string = await this.googleSheetConnectorService.readCell(
          this.googleSheetId,
          `${sheetName}!${sheetTitlesRange[i]}${rowIndex}`,
        );
        if (searchText.toLowerCase().includes(string.toLowerCase())) {
          return i;
        }
        i++;
      } catch (e) {
        return null;
      }
    } while (string);

    return i;
  }

  async getRangeSize(sheetName: string = 'Расписание', rowIndex: number = 1) {
    let i = 0;
    let string;

    do {
      try {
        string = await this.googleSheetConnectorService.readCell(
          this.googleSheetId,
          `${sheetName}!${sheetTitlesRange[i]}${rowIndex}`,
        );
        i++;
      } catch (e) {
        return {
          lastIndex: i,
        };
      }
    } while (string);

    return {
      lastIndex: i,
    };
  }

  async writeToSheet(
    sheetName: string,
    columnIndex: number,
    day: string,
    value: {
      name: string;
      time: string;
      duration: string | number;
      type: string;
    },
  ) {
    console.log('Начало записи в таблицу');
    const rowIndexes = getDayRowsIndexes(day);
    const range = `${sheetName}!${sheetTitlesRange[columnIndex]}${rowIndexes.startIndex}:${sheetTitlesRange[columnIndex]}${rowIndexes.endIndex}`;
    await this.googleSheetConnectorService.writeRange(
      this.googleSheetId,
      range,
      [[value.name], [value.time], [value.duration], [value.type]],
    );

    console.log('Новые данные записаны');
    return;
  }

  async createSheet() {}
}
