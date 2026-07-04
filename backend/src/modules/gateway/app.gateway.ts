import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();
  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token
        : undefined;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isActive: true },
      });

      if (!user?.isActive) {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      const sockets = this.userSockets.get(user.id) ?? [];
      sockets.push(client.id);
      this.userSockets.set(user.id, sockets);
    } catch (error) {
      this.logger.warn(
        `Rejected socket connection: ${error instanceof Error ? error.message : 'invalid token'}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    const sockets = this.userSockets.get(userId) ?? [];
    const filtered = sockets.filter((s) => s !== client.id);
    if (filtered.length === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, filtered);
    }
  }

  sendToUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  broadcast(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
