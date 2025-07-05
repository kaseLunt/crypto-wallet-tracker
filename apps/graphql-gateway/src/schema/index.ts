import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadSchema(): Promise<string> {
  // Define the order for schema files
  const schemaOrder = [
    "types/common.graphql", // Common types first
    "schema.graphql", // Root schema
    "types/*.graphql", // All other type files
  ];

  const schemaFiles: string[] = [];

  for (const pattern of schemaOrder) {
    const files = await glob(pattern, {
      cwd: __dirname,
      absolute: true,
    });

    // Avoid duplicates
    for (const file of files) {
      if (!schemaFiles.includes(file)) {
        schemaFiles.push(file);
      }
    }
  }

  // Read and combine all schema files
  return schemaFiles.map((file) => readFileSync(file, "utf-8")).join("\n\n");
}
