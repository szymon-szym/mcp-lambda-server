import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GetPromptResult } from "@modelcontextprotocol/sdk/types";
import { z } from "zod";
import { S3Service } from "../services/s3Service";

export const initializeServer = (s3Service: S3Service): McpServer => {
  const server = new McpServer(
    {
      name: "prompt-gallery-server",
      version: "1.0.0",
    },
    { capabilities: { logging: {} } }
  );
  // Register a simple prompt
  server.prompt(
    "greeting-template",
    "A simple greeting prompt template",
    {
      name: z.string().describe("Name to include in greeting"),
    },
    async ({ name }): Promise<GetPromptResult> => {
      const promptTemplate = await s3Service.getFile("prompts/greetings_prompt.txt");
      
      const prompt = promptTemplate.replace("{{name}}", name)

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt,
            },
          },
        ],
      };
    }
  );

  return server;
};
