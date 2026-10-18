import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import Breadcrumbs from './Breadcrumbs.jsx';
import Weave from '../ui/Weave.jsx';

/** Kepala halaman dalam: breadcrumb, judul, pengantar, dan slot aksi di kanan. */
export default function PageHeader({ title, lead, crumbs = [], actions, titleForDocument }) {
  useDocumentTitle(titleForDocument ?? title);
  return (
    <header className="relative pt-32 sm:pt-36">
      <div className="shell">
        <Breadcrumbs items={crumbs.length ? crumbs : [{ label: title }]} />
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-[clamp(2.25rem,5.2vw,4rem)] font-medium leading-[1.04]">{title}</h1>
            {lead && <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">{lead}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </div>
      </div>
      <div className="shell mt-10">
        <Weave height={8} tone="brand" className="opacity-70" />
      </div>
    </header>
  );
}
