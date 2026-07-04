import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class BulkIdsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}
