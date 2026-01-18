import { domainPoolStorage } from './src/storage/domain-pool.js';

setTimeout(async () => {
  try {
    const config = await domainPoolStorage.getConfig();
    console.log('Config:', JSON.stringify(config, null, 2));
    const stats = await domainPoolStorage.getStatistics();
    console.log('Stats:', JSON.stringify(stats, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}, 1000);
