import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  whatsappNumber?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  passportNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nationality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
