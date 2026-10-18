import { useEffect } from 'react';

const SUFFIX = 'PUI Literasi dan Seni | UNIMED';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SUFFIX}` : 'PUI Literasi dan Seni dalam Pendidikan | Universitas Negeri Medan';
  }, [title]);
}
