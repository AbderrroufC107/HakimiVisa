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

@Controller('templates')
@UseGuards(JwtAuthGuard)
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
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post('render')
  render(@Body() dto: RenderTemplateDto) {
    return this.templatesService.render(dto);
  }

  @Post('whatsapp-link')
  whatsappLink(@Body() dto: RenderTemplateDto) {
    return this.messagesService.buildWhatsappLink(dto);
  }

  @Post('send-email')
  sendEmail(@Body() dto: RenderTemplateDto & { to?: string }) {
    return this.messagesService.sendEmail(dto);
  }
}
