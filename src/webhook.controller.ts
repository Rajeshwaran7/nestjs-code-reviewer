import { Controller, Post, Headers, Body } from '@nestjs/common';
import { GithubService } from './github/github.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly githubService: GithubService) {}

  /**
   * Handles the webhook event from GitHub.
   * @param event The GitHub event type.
   * @param payload The payload containing the webhook data.
   * @returns A promise that resolves to the processed webhook.
   */
  @Post()
  async handleWebhook(@Headers('X-GitHub-Event') event: string, @Body() payload: any) {
 
    if (payload.number && payload.action === 'opened') {
      console.log("Processing pull request");
      await this.githubService.processPullRequest(payload);
    }
    return { message: 'Webhook received' };
  }
}
