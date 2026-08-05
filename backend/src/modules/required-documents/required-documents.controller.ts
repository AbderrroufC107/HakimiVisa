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
import { ApiTags } from '@nestjs/swagger';
import { RequiredDocumentsService } from './required-documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateRequiredDocumentDto,
  UpdateRequiredDocumentDto,
  QueryRequiredDocumentDto,
} from './dto';

@ApiTags('Required documents')
@Controller('required-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequiredDocumentsController {
  constructor(private readonly service: RequiredDocumentsService) {}

  /** Agencies need to read the checklist they are being asked to satisfy. */
  @Get('for-case')
  findForCase(@Query() query: QueryRequiredDocumentDto) {
    return this.service.findForCase(query);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateRequiredDocumentDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateRequiredDocumentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
