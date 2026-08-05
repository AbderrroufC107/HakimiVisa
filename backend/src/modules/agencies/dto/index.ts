import { IsString, IsOptional, IsEmail, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  contactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  contactEmail?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateAgencyDto extends CreateAgencyDto {
  @IsString()
  @IsOptional()
  declare name: string;
}

/** Creates the login the agency will use, already bound to that agency. */
export class CreateAgencyUserDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;
}
