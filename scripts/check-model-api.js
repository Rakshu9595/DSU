import { modelApiClient } from '../backend/services/model-api-client.service.js';

async function main() {
  console.log('--- VisionTwin Model Server Connectivity Check ---');
  console.log(`Target: ${modelApiClient.baseUrl}`);

  const health = await modelApiClient.checkHealth();
  if (health.isOnline) {
    console.log('✅ Model server is ONLINE and responding.');
    console.log('Details:', JSON.stringify(health, null, 2));
  } else {
    console.error('❌ Model server is OFFLINE or unreachable.');
    console.error('Error:', health.error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
