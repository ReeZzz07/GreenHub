import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ModerateListingDto } from './dto/moderate-listing.dto';

interface RequestUser {
  id: string;
  role: UserRole;
}

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll(@Query() query: QueryListingsDto) {
    return this.listingsService.findPublished(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: RequestUser) {
    return this.listingsService.findMine(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Get('moderation-queue')
  findModerationQueue() {
    return this.listingsService.findModerationQueue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findPublishedById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateListingDto, @CurrentUser() user: RequestUser) {
    return this.listingsService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.listingsService.update(id, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.listingsService.remove(id, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  @Patch(':id/moderate')
  moderate(@Param('id') id: string, @Body() dto: ModerateListingDto) {
    return this.listingsService.moderate(id, dto);
  }
}
