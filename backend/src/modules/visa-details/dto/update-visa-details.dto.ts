import { PartialType } from '@nestjs/mapped-types';
import { CreateVisaDetailsDto } from './create-visa-details.dto';

export class UpdateVisaDetailsDto extends PartialType(CreateVisaDetailsDto) {}
