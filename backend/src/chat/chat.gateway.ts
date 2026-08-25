import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

interface JwtPayload {
  sub: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) throw new UnauthorizedException();

      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      client.data.userId = user.id;

      const conversations = await this.chatService.findMine(user.id);
      await Promise.all(conversations.map((c) => client.join(c.id)));
    } catch (error) {
      this.logger.warn(`Отклонено WebSocket-подключение: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.chatService.assertParticipant(data.conversationId, client.data.userId);
    await client.join(data.conversationId);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const message = await this.chatService.sendMessage(
      data.conversationId,
      client.data.userId,
      data.content,
    );
    this.server.to(data.conversationId).emit('newMessage', message);
    return message;
  }
}
