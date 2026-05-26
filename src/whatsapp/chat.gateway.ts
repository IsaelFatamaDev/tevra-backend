import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  
  emitMessageToAdmins(tenantId: string, message: any) {
    
    this.server.to(`admin_${tenantId}`).emit('whatsapp_message_received', message);
  }

  @SubscribeMessage('join_admin_room')
  handleJoinAdminRoom(@MessageBody() data: { tenantId: string }, @ConnectedSocket() client: Socket) {
    if (data.tenantId) {
      client.join(`admin_${data.tenantId}`);
      console.log(`Client joined admin_${data.tenantId}`);
    }
  }
}
