import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateNoteDto, UpdateNoteDto } from './dto';

@Controller('clients/:clientId/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get()
  findAll(@Param('clientId') clientId: string) {
    return this.notesService.findByClient(clientId);
  }

  @Post()
  create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.create(clientId, dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notesService.remove(id, userId);
  }
}
