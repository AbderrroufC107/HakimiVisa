import { PartialType } from '@nestjs/mapped-types';
import { CreateVisaCaseDto } from './create-visa-case.dto';

export class UpdateVisaCaseDto extends PartialType(CreateVisaCaseDto) {
  clientId?: string;
}
