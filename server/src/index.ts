import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp(env.pythonServiceBaseUrl, env.internalApiToken);

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${env.port}`);
});
