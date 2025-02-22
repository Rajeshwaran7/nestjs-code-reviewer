import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubService } from './github/github.service';
import { WebhookController } from './webhook.controller';
import { OpenAIService } from './openai/openai.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [WebhookController],
  providers: [GithubService, OpenAIService],
})
export class AppModule {}
