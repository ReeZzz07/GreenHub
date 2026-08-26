import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

interface YooKassaWebhookPayload {
  event: string;
  object: { id: string };
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@CurrentUser() user: { id: string }) {
    return this.ordersService.findMine(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: { id: string }) {
    return this.ordersService.create(user.id, dto);
  }

  // Публичный эндпоинт — ЮKassa стучится сюда напрямую, без JWT
  @Post('yookassa/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: YooKassaWebhookPayload) {
    if (payload?.object?.id) {
      await this.ordersService.handleWebhook(payload.object.id);
    }
    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.ordersService.findOne(id, user.id);
  }
}
