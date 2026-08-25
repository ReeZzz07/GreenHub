import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.chatService.findMine(user.id);
  }

  @Post()
  create(@Body() dto: CreateConversationDto, @CurrentUser() user: { id: string }) {
    return this.chatService.getOrCreateConversation(user.id, dto.listingId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.chatService.assertParticipant(id, user.id);
  }

  @Get(':id/messages')
  findMessages(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.chatService.findMessages(id, user.id);
  }
}
