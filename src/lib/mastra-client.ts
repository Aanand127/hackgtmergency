import { MastraClient } from "@mastra/client-js";

// Point to the backend server
export const mastraClient = new MastraClient({
  baseUrl: "http://localhost:4111/",
});
