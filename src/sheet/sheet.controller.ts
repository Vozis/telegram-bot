import { Controller } from '@nestjs/common';
import { SheetService } from './sheet.service';

@Controller('sheet')
export class SheetController {
  constructor(private readonly sheetService: SheetService) {}
}
