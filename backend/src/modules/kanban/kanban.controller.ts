import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryKanbanDto } from './dto';

@Controller('kanban')
@UseGuards(JwtAuthGuard)
export class KanbanController {
  constructor(private kanbanService: KanbanService) {}

  @Get()
  getBoard(
    @Query() query: QueryKanbanDto,
    @CurrentUser('agencyId') agencyId: string | null,
  ) {
    return this.kanbanService.getBoard(query, agencyId);
  }
}
