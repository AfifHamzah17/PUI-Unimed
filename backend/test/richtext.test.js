import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { richToText, sanitizeRich } from '../src/shared/richtext.js';
import { doc, para } from './helpers.js';

const ok = (raw) => { const r = sanitizeRich(raw); assert.ok(!r.error, r.error); return r.value; };

describe('sanitasi teks kaya', () => {
  test('null, kosong, dan dokumen tanpa isi -> null', () => {
    assert.equal(ok(null), null);
    assert.equal(ok(undefined), null);
    assert.equal(ok({ type: 'doc', content: [] }), null);
    assert.equal(ok(doc({ type: 'paragraph' })), null); // dokumen kosong bawaan Tiptap
    assert.equal(ok(doc({ type: 'paragraph' }, { type: 'paragraph' })), null);
    assert.notEqual(ok(doc({ type: 'horizontalRule' })), null);
  });
  test('dokumen sah dipertahankan apa adanya', () => {
    const d = doc({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Judul' }] }, para('Halo', [{ type: 'bold' }, { type: 'italic' }]),
      { type: 'bulletList', content: [{ type: 'listItem', content: [para('satu')] }] });
    assert.deepEqual(ok(d), d);
  });
  test('atribut sembarang dibuang (onclick, style, class)', () => {
    const v = ok(doc({ type: 'paragraph', attrs: { onclick: 'x()', style: 'color:red', class: 'a' }, content: [{ type: 'text', text: 'a', attrs: { onerror: 'x' } }] }));
    assert.deepEqual(v.content[0], { type: 'paragraph', content: [{ type: 'text', text: 'a' }] });
  });
  test('tautan javascript:, data:, //evil dibuang; https, mailto, relatif diterima', () => {
    const link = (href) => ok(doc(para('t', [{ type: 'link', attrs: { href } }]))).content[0].content[0].marks;
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', '//evil.com', 'vbscript:x', ' javascript:x', 'ftp://x']) assert.equal(link(bad), undefined, bad);
    assert.deepEqual(link('https://a.id/x'), [{ type: 'link', attrs: { href: 'https://a.id/x' } }]);
    assert.deepEqual(link('mailto:a@b.id'), [{ type: 'link', attrs: { href: 'mailto:a@b.id' } }]);
    assert.deepEqual(link('/kegiatan/workshop'), [{ type: 'link', attrs: { href: '/kegiatan/workshop' } }]);
  });
  test('gambar: hanya https atau relatif; lainnya dibuang', () => {
    const img = (src) => ok(doc(para('x'), { type: 'image', attrs: { src, alt: 'a' } })).content;
    assert.equal(img('https://files.test/a.webp').length, 2);
    assert.equal(img('/foto/a.webp').length, 2);
    for (const bad of ['http://x/a.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,AAA', '//x/a.png', '']) assert.equal(img(bad).length, 1, bad);
  });
  test('jenis simpul tak dikenal ditolak (script, iframe, tabel)', () => {
    for (const type of ['script', 'iframe', 'table', 'div', 'html']) assert.ok(sanitizeRich(doc({ type })).error, type);
  });
  test('simpul di tempat salah ditolak (listItem langsung di doc, heading di dalam heading)', () => {
    assert.ok(sanitizeRich(doc({ type: 'listItem', content: [para('x')] })).error);
    assert.ok(sanitizeRich(doc({ type: 'heading', content: [{ type: 'heading' }] })).error);
  });
  test('gaya teks tak dikenal ditolak', () => {
    assert.ok(sanitizeRich(doc(para('x', [{ type: 'textStyle', attrs: { color: 'red' } }]))).error);
  });
  test('level heading dibatasi 2-4', () => {
    const lv = (n) => ok(doc({ type: 'heading', attrs: { level: n }, content: [{ type: 'text', text: 'x' }] })).content[0].attrs.level;
    assert.deepEqual([1, 2, 3, 4, 5, 99, 'x'].map(lv), [2, 2, 3, 4, 2, 2, 2]);
  });
  test('blok kode: gaya teks dibuang', () => {
    const v = ok(doc({ type: 'codeBlock', content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }] }] }));
    assert.equal(v.content[0].content[0].marks, undefined);
  });
  test('batas: terlalu bersarang, terlalu banyak simpul, terlalu banyak teks', () => {
    let nested = para('x');
    for (let i = 0; i < 12; i += 1) nested = { type: 'blockquote', content: [nested] };
    assert.ok(sanitizeRich(doc(nested)).error);
    assert.ok(sanitizeRich(doc(...Array.from({ length: 4500 }, () => para('a')))).error);
    assert.ok(sanitizeRich(doc(para('x'.repeat(90_000)))).error);
  });
  test('bentuk bukan dokumen ditolak', () => {
    for (const bad of ['<p>hai</p>', [], 5, { type: 'paragraph' }, { type: 'doc', content: 'x' }]) assert.ok(sanitizeRich(bad).error, JSON.stringify(bad));
  });
  test('objek berbahaya dengan __proto__ tidak mencemari', () => {
    const evil = JSON.parse('{"type":"doc","content":[{"type":"paragraph","__proto__":{"polluted":1},"content":[{"type":"text","text":"a"}]}]}');
    sanitizeRich(evil);
    assert.equal({}.polluted, undefined);
  });
  test('richToText', () => {
    assert.equal(richToText(doc(para('Halo'), para('dunia'))), 'Halo dunia');
    assert.equal(richToText(null), '');
  });
});
