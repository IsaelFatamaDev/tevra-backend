import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentApplication } from './entities/agent-application.entity';
import { User } from '../users/entities/user.entity';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agent, AgentApplication, User]), MailModule],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule { }
