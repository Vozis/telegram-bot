import { Module } from '@nestjs/common';
import { SheetService } from './sheet.service';
import { SheetController } from './sheet.controller';
import * as credentials from '../../service_account.json';
import { GoogleSheetModule } from 'nest-google-sheet-connector';

@Module({
  imports: [GoogleSheetModule.register(credentials)],
  controllers: [SheetController],
  providers: [SheetService],
  exports: [SheetService],
})
export class SheetModule {}
