import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { MessagesService } from './messages.service';
import { CreateTemplateDto, UpdateTemplateDto, RenderTemplateDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeskOnlyGuard } from '../../common/guards/desk-only.guard';

@Controller('templates')
// Every route here is desk-only. The wording the desk sends its clients is
// its own; a partner agency has no reason to read it, and the write routes
// were already refused.
@UseGuards(JwtAuthGuard, DeskOnlyGuard)
export class TemplatesController {
  constructor(
    private templatesService: TemplatesService,
    private messagesService: MessagesService,
  ) {}

  @Get()
  findAll(@Query('channel') channel?: string) {
    return this.templatesService.findAll(channel);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @UseGuards(DeskOnlyGuard)
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(DeskOnlyGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(DeskOnlyGuard)
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post('render')
  render(@Body() dto: RenderTemplateDto) {
    return this.templatesService.render(dto);
  }

  @Post('whatsapp-link')
  @UseGuards(DeskOnlyGuard)
  whatsappLink(@Body() dto: RenderTemplateDto) {
    return this.messagesService.buildWhatsappLink(dto);
  }

  @Post('send-email')
  @UseGuards(DeskOnlyGuard)
  sendEmail(@Body() dto: RenderTemplateDto & { to?: string }) {
    return this.messagesService.sendEmail(dto);
  }
}
