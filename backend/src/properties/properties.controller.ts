import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, AddBlockedPeriodDto, RemoveBlockedPeriodDto } from './dto/create-property.dto';
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

  // ── Public ────────────────────────────────────────────────────
  @Get()
  findAll(
    @Query() query: {
      city?: string;
      minPrice?: number;
      maxPrice?: number;
      guests?: number;
      checkIn?: string;
      checkOut?: string;
    },
  ) {
    return this.propertiesService.findAll({
      ...query,
      checkIn: query.checkIn ? new Date(query.checkIn) : undefined,
      checkOut: query.checkOut ? new Date(query.checkOut) : undefined,
    });
  }

  // Static GET routes before @Get(':id')
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllForAdmin(@Query('status') status?: PropertyStatus) {
    return this.propertiesService.findAllForAdmin({ status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  // ── Admin only — single host account manages all listings ─────
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setStatus(@Param('id') id: string, @Body('status') status: PropertyStatus) {
    return this.propertiesService.setStatus(id, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: UserDocument) {
    return this.propertiesService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePropertyDto>,
    @CurrentUser() user: UserDocument,
  ) {
    return this.propertiesService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.propertiesService.delete(id, user);
  }

  @Post(':id/block-periods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  addBlockedPeriods(
    @Param('id') id: string,
    @Body() dto: AddBlockedPeriodDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.propertiesService.addBlockedPeriods(id, dto, user);
  }

  @Delete(':id/block-periods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeBlockedPeriods(
    @Param('id') id: string,
    @Body() dto: RemoveBlockedPeriodDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.propertiesService.removeBlockedPeriods(id, dto.periodIds, user);
  }
}
