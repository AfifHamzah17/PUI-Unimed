import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn.js';

/**
 * Merender JSON teks kaya (Tiptap/ProseMirror) menjadi elemen React. Tidak ada HTML mentah dan tidak ada
 * dangerouslySetInnerHTML: hanya jenis simpul yang dikenal yang dirender, jadi isi dari server tidak bisa menyuntikkan skrip.
 * Backend sudah membersihkan isinya; renderer ini sengaja tetap defensif.
 */
function A({ href, children }) {
  if (typeof href !== 'string') return children;
  if (href.startsWith('/') && !href.startsWith('//')) return <Link to={href}>{children}</Link>;
  if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  if (/^mailto:/i.test(href)) return <a href={href}>{children}</a>;
  return children;
}

function renderText(n, key) {
  let el = n.text;
  for (const m of n.marks ?? []) {
    if (m.type === 'bold') el = <strong>{el}</strong>;
    else if (m.type === 'italic') el = <em>{el}</em>;
    else if (m.type === 'strike') el = <s>{el}</s>;
    else if (m.type === 'code') el = <code>{el}</code>;
    else if (m.type === 'link') el = <A href={m.attrs?.href}>{el}</A>;
  }
  return <span key={key} className="contents">{el}</span>;
}

function renderNode(n, key) {
  const kids = (n.content ?? []).map((c, i) => renderNode(c, i));
  switch (n.type) {
    case 'text': return renderText(n, key);
    case 'paragraph': return <p key={key}>{kids}</p>;
    case 'heading': {
      const Tag = `h${[2, 3, 4].includes(n.attrs?.level) ? n.attrs.level : 2}`;
      return <Tag key={key}>{kids}</Tag>;
    }
    case 'bulletList': return <ul key={key}>{kids}</ul>;
    case 'orderedList': return <ol key={key}>{kids}</ol>;
    case 'listItem': return <li key={key}>{kids}</li>;
    case 'blockquote': return <blockquote key={key}>{kids}</blockquote>;
    case 'codeBlock': return <pre key={key}><code>{kids}</code></pre>;
    case 'hardBreak': return <br key={key} />;
    case 'horizontalRule': return <hr key={key} />;
    case 'image':
      return typeof n.attrs?.src === 'string' ? (
        <img key={key} src={n.attrs.src} alt={n.attrs.alt ?? ''} loading="lazy" decoding="async" />
      ) : null;
    default: return null;
  }
}

export default function RichText({ doc, className }) {
  if (!doc?.content?.length) return null;
  return <div className={cn('rich', className)}>{doc.content.map((n, i) => renderNode(n, i))}</div>;
}
