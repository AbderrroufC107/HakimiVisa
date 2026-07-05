import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RefDataService } from './ref-data.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('ref-data')
@UseGuards(JwtAuthGuard)
export class RefDataController {
  constructor(private refDataService: RefDataService) {}

  @Get('countries')
  findAllCountries() {
    return this.refDataService.findAllCountries();
  }

  @Post('countries')
  createCountry(@Body('name') name: string) {
    return this.refDataService.createCountry(name);
  }

  @Get('visa-types')
  findAllVisaTypes() {
    return this.refDataService.findAllVisaTypes();
  }

  @Post('visa-types')
  createVisaType(@Body('name') name: string) {
    return this.refDataService.createVisaType(name);
  }
}
