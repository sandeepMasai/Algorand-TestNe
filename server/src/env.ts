import { z } from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  ALGOD_SERVER: z.string().min(1, "ALGOD_SERVER is required"),
  ALGOD_PORT: z.string().default(""),
  ALGOD_TOKEN: z.string().default(""),
  INDEXER_SERVER: z.string().optional(),
  INDEXER_PORT: z.string().optional(),
  INDEXER_TOKEN: z.string().optional(),
});

try {
  // eslint-disable-next-line node/no-process-env
  envSchema.parse(process.env);
}
catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Missing environment variables:", error.issues.flatMap(issue => issue.path));
  }
  else {
    console.error(error);
  }
  process.exit(1);
}

// eslint-disable-next-line node/no-process-env
export const env = envSchema.parse(process.env);
