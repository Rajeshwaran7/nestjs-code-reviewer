import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OpenAIService } from 'src/openai/openai.service';

@Injectable()
export class GithubService {
  private readonly githubToken = process.env.GITHUB_TOKEN;

  constructor(private readonly openAIService: OpenAIService) {}

  /**
   * Processes a pull request from GitHub.
   * @param payload The payload containing the pull request data.
   * @returns A promise that resolves to the processed pull request.
   */
  async processPullRequest(payload: any) {
    console.log("Processing pull request");
    const repo = payload.repository.full_name;
    const branch = payload.pull_request.head.ref;
    const prNumber = payload.number;
    const files = await this.getChangedFiles(repo, prNumber);
    console.log("Files: ", files);
    for (const file of files) {
      const code = await this.getFileContent(repo, file.filename, branch);
      console.log("Code: ", code);
      if (code) {
        const reviewComments = await this.openAIService.reviewCode(code);
        console.log("Review Comments: ", reviewComments);
        if (reviewComments) {
          await this.commentOnPR(repo, prNumber, file.filename, reviewComments);
          console.log("Commented on PR");
        }
      }
    }
  }

  /**
   * Retrieves the changed files from a pull request.
   * @param repo The repository name.
   * @param prNumber The pull request number.
   * @returns A promise that resolves to the changed files.
   */
  private async getChangedFiles(repo: string, prNumber: number) {
    const url = `https://api.github.com/repos/${repo}/pulls/${prNumber}/files`;
    const response = await axios.get(url, { headers: this.getAuthHeaders() });
    return response.data;
  }

  /**
   * Retrieves the content of a file from a repository.
   * @param repo The repository name.
   * @param filename The filename to retrieve.
   * @param branch The branch to retrieve the file from.
   * @returns A promise that resolves to the file content.
   */
  private async getFileContent(repo: string, filename: string, branch: string) {
    try {
      const encodedFilename = encodeURIComponent(filename);
      const url = `https://api.github.com/repos/${repo}/contents/${encodedFilename}?ref=${branch}`; // Change 'main' to your default branch
  
      console.log(`Fetching file from: ${url}`);
      const response = await axios.get(url, { headers: this.getAuthHeaders() });
  
      if (!response.data.content) {
        throw new Error(`File content not found for ${filename}`);
      }
  
      return Buffer.from(response.data.content, 'base64').toString('utf-8');
    } catch (error) {
      console.error(`Error fetching file content: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Comments on a pull request.
   * @param repo The repository name.
   * @param prNumber The pull request number.
   * @param filename The filename to comment on.
   * @param comment The comment to add.
   */
  private async commentOnPR(repo: string, prNumber: number, filename: string, comment: string) {
    console.log("Commenting on PR");
    const url = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
    await axios.post(url, { body: `Code Review for \`${filename}\`:\n${comment}` }, { headers: this.getAuthHeaders() });
  }

  /**
   * Retrieves the authentication headers for GitHub API requests.
   * @returns An object containing the authentication headers.
   */
  private getAuthHeaders() {
    return { Authorization: `token ${this.githubToken}`, Accept: 'application/vnd.github.v3+json' };
  }
}
