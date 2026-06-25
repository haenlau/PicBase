// cleanup-sessions.js
// 运行方式: node cleanup-sessions.js

const WRANGLER_CMD = process.platform === 'win32' ? 'npx.cmd' : 'npx';

async function main() {
  console.log('清理 KV 中的 session 数据...');
  console.log('请在 Cloudflare Dashboard 中手动删除以下键:');
  console.log('');
  console.log('manage@session@*');
  console.log('');
  console.log('或者使用 Wrangler CLI:');
  console.log('');
  console.log('npx wrangler kv key list --binding=img_url --prefix="manage@session@"');
  console.log('');
  console.log('然后逐个删除:');
  console.log('npx wrangler kv key delete --binding=img_url "manage@session@<key>"');
}

main();
