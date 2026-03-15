import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { UserDocument } from '../users/schemas/user.schema';
import { PropertyStatus } from './schemas/property.schema';

@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  // Public — browse approved properties
  @Get()
  findAll(@Query() query: { city?: string; minPrice?: number; maxPrice?: number; guests?: number }) {
    return this.propertiesService.findAll(query);
  }

  // Admin — browse all properties (pending, approved, rejected)
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllForAdmin(
    @Query() query: { city?: string; minPrice?: number; maxPrice?: number; guests?: number; status?: PropertyStatus },
  ) {
    return this.propertiesService.findAllForAdmin(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // Owner — manage own properties
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: UserDocument) {
    return this.propertiesService.create(dto, user);
  }

  @Get('owner/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  myProperties(@CurrentUser() user: UserDocument) {
    return this.propertiesService.findByOwner(user._id.toString());
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: Partial<CreatePropertyDto>, @CurrentUser() user: UserDocument) {
    return this.propertiesService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.propertiesService.delete(id, user);
  }

  // Admin — verify properties
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: PropertyStatus) {
    return this.propertiesService.updateStatus(id, status);
  }

  // Owner — block dates on calendar
  @Post(':id/block-dates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  blockDates(@Param('id') id: string, @Body('dates') dates: Date[], @CurrentUser() user: UserDocument) {
    return this.propertiesService.blockDates(id, dates, user);
  }
}