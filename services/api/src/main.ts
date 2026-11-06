import { createApp } from './app.factory';
import { loadConfig } from './config';

async function main() {
  const config = loadConfig();
  const app = await createApp(config);
  await app.listen(config.PORT);
  console.log(`HumanLift API listening on port ${config.PORT} (${config.APP_ENV})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
