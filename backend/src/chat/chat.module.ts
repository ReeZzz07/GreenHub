import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationsController } from './conversations.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [AuthModule],
  controllers: [ConversationsController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
