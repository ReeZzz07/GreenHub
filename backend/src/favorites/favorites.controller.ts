import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('mine')
  findMine(@CurrentUser() user: { id: string }) {
    return this.favoritesService.findMine(user.id);
  }

  @Get('mine/ids')
  findMineIds(@CurrentUser() user: { id: string }) {
    return this.favoritesService.findMineIds(user.id);
  }

  @Post(':listingId')
  add(@Param('listingId') listingId: string, @CurrentUser() user: { id: string }) {
    return this.favoritesService.add(user.id, listingId);
  }

  @Delete(':listingId')
  remove(@Param('listingId') listingId: string, @CurrentUser() user: { id: string }) {
    return this.favoritesService.remove(user.id, listingId);
  }
}
