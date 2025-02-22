import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openAIUrl = process.env.AZURE_OPENAI_URL;
  private readonly apiKey = process.env.AZURE_OPENAI_API_KEY;
  private readonly deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;

  constructor() {
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.openAIUrl || !this.apiKey || !this.deploymentName) {
      throw new Error('Missing required environment variables for OpenAI service.');
    }
  }

  /**
   * Reviews the provided TypeScript/NestJS code using Azure OpenAI.
   * @param code The code to be reviewed.
   * @returns A detailed review of the code.
   * @throws Error if the API call fails or the response is invalid.
   */
  async reviewCode(code: string): Promise<string> {
    const prompt = `Analyze the following TypeScript/NestJS code for best practices, security vulnerabilities, and performance optimizations. Provide a detailed review:\n\n${code}`;
  
    const apiUrl = `${this.openAIUrl}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-01`;

     try {
      const response = await axios.post(
        apiUrl,
        {
          model: "gpt-4o-mini",
          messages: [
            { role: 'system', content: 'You are a senior NestJS code reviewer.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );
  
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from OpenAI API');
      }
  
      return response.data.choices[0].message.content;
      } catch (error) {
      this.logger.error('Error calling OpenAI API:', error.response?.data || error.message);
      throw new Error('Failed to fetch OpenAI response');
    }
  }
}