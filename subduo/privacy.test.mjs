import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('./privacy-policy.html', import.meta.url), 'utf8');

test('両言語で現行5サイト・端末内保存・任意AIの送信先と識別子を開示する', () => {
  const parts = html.split(/<div class="container(?: on)?" data-lang="(?:en|ja)">/).slice(1);
  assert.equal(parts.length, 2);
  for (const part of parts) {
    for (const term of ['Prime Video', 'YouTube', 'Netflix', 'Disney+', 'TED', 'chrome.storage.sync', 'chrome.storage.local', 'sidePanel', 'subduo-explain.warload57.workers.dev', 'Cloudflare', 'OpenAI', 'IP']) assert.ok(part.includes(term), term);
    assert.match(part, /Ask AI|AIに聞く/);
    assert.match(part, /24/);
    assert.match(part, /30/);
    assert.ok(part.includes('https://developers.openai.com/api/docs/guides/your-data'));
    assert.ok(!/has no server|collects nothing|sends nothing|サーバーはありません|何も送信せず/.test(part));
  }
});

test('公開ポリシーのURLと英日切替を保ち、古い外部送信なしのSEO説明を残さない', () => {
  assert.ok(html.includes('https://ramune441.github.io/subduo/privacy-policy.html'));
  assert.match(html, /data-set="en"/);
  assert.match(html, /data-set="ja"/);
  assert.ok(!/runs entirely in the browser: no server/.test(html));
});
