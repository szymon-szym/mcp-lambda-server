import express, { Request, Response } from "express";
import { initializeServer } from "./server/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { S3Client } from "@aws-sdk/client-s3";
import { S3Service } from "./services/s3Service";

// initialize S3 service
const client = new S3Client();
const bucketName = process.env.BUCKET_NAME || "bucket name missing";

const s3Service = new S3Service(client, bucketName)

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
    console.log(`req body: ${JSON.stringify(req.body)}`);

  const server = initializeServer(s3Service);
  
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);

    req.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });
  } catch (e) {
    console.error("Error handling MCP request:", e);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
    console.log('Received GET MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });
  
  app.delete('/mcp', async (req: Request, res: Response) => {
    console.log('Received DELETE MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });

  const PORT = 8080;

  app.listen(PORT, () => {
    console.log(`MCP server running on ${PORT}`)
  })