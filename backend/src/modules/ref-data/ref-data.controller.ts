import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
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

  @Patch('countries/:id')
  updateCountry(@Param('id') id: string, @Body('name') name: string) {
    return this.refDataService.updateCountry(id, name);
  }

  @Delete('countries/:id')
  removeCountry(@Param('id') id: string) {
    return this.refDataService.removeCountry(id);
  }

  @Get('visa-types')
  findAllVisaTypes() {
    return this.refDataService.findAllVisaTypes();
  }

  @Post('visa-types')
  createVisaType(@Body('name') name: string) {
    return this.refDataService.createVisaType(name);
  }

  @Patch('visa-types/:id')
  updateVisaType(@Param('id') id: string, @Body('name') name: string) {
    return this.refDataService.updateVisaType(id, name);
  }

  @Delete('visa-types/:id')
  removeVisaType(@Param('id') id: string) {
    return this.refDataService.removeVisaType(id);
  }
}
