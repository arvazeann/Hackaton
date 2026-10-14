import { config as loadEnv } from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { STORED_IMAGE_FILENAME_PATTERN } from "@/lib/product-images";
import { getUploadDirectory } from "@/server/storage/local-image-storage";
import {
  copyLocalImageToSupabase,
  supabaseImageExists,
} from "@/server/storage/supabase-image-storage";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

async function main() {
  const directory = getUploadDirectory();
  const filenames = (await readdir(directory)).filter((name) =>
    STORED_IMAGE_FILENAME_PATTERN.test(name),
  );
  let copied = 0;
  let verified = 0;

  for (const filename of filenames) {
    if (!(await supabaseImageExists(filename))) {
      await copyLocalImageToSupabase(
        filename,
        await readFile(path.join(directory, filename)),
      );
      copied += 1;
    }
    if (!(await supabaseImageExists(filename)))
      throw new Error(`Storage verification failed for ${filename}`);
    verified += 1;
  }

  console.log(
    `Local image migration complete: ${copied} copied, ${verified} verified.`,
  );
  console.log("Local source files were retained.");
}

main().catch(() => {
  console.error(
    "Local image migration failed. Check the bucket setup and server environment.",
  );
  process.exitCode = 1;
});
