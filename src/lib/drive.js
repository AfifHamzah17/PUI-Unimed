/** Mengambil id berkas dari tautan Google Drive (…/file/d/<id>/view, ?id=<id>, atau open?id=<id>). Null bila bukan tautan Drive. */
export function driveId(url = '') {
  const m = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/.exec(url) || /[?&]id=([\w-]{20,})/.exec(url);
  return m ? m[1] : null;
}
export const driveStream = (id) => `https://drive.usercontent.google.com/download?id=${id}&export=download`;
export const drivePreview = (id) => `https://drive.google.com/file/d/${id}/preview`;
