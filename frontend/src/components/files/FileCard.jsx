import { useEffect, useMemo, useState } from 'react';
import { formatBytes } from '../../utils/formatBytes';
import { timeAgo } from '../../utils/formatDate';
import { filesApi } from '../../api/filesApi';
import { Button } from '../ui/Button';

function mimeLabel(mime = '') {
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'IMG';
  if (m === 'application/pdf') return 'PDF';
  if (m.includes('word') || m.includes('document')) return 'DOC';
  if (m.includes('presentation')) return 'PPT';
  if (m.includes('sheet') || m.includes('excel') || m.includes('csv')) return 'XLS';
  if (m.startsWith('video/')) return 'VID';
  if (m.startsWith('audio/')) return 'AUD';
  if (m.startsWith('text/')) return 'TXT';
  return 'FILE';
}

function FileThumbnail({ file }) {
  const mime = (file?.mime_type || '').toLowerCase();
  const isImage = mime.startsWith('image/');
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    if (!isImage) {
      setUrl(null);
      setFailed(false);
      return () => {};
    }

    filesApi.preview(file.id)
      .then(res => {
        const contentType = (res.headers['content-type'] || mime || 'image/jpeg').split(';')[0].trim();
        objectUrl = URL.createObjectURL(new Blob([res.data], { type: contentType }));
        if (active) setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.id, isImage, mime]);

  const label = useMemo(() => mimeLabel(mime), [mime]);

  if (isImage && url && !failed) {
    return (
      <img
        src={url}
        alt={file.original_name}
        className="relative z-10 max-h-[82%] max-w-[82%] rounded-lg object-contain"
      />
    );
  }

  return (
    <div className="relative z-10 flex flex-col items-center justify-center rounded-lg border border-[rgba(var(--brand-rgb),0.28)] bg-[rgba(var(--brand-rgb),0.08)] px-4 py-3 text-sm font-semibold tracking-wide brand-neon-text-soft">
      <svg viewBox="0 0 24 24" className="mb-1 h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      {label}
    </div>
  );
}

export function FileCard({ file, onDownload, onPreview, onShare, onDelete, downloading }) {
  return (
    <article className="group relative flex h-[300px] overflow-hidden rounded-[14px] border border-[rgba(var(--brand-rgb),0.2)] bg-[#0F172A] shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.08),0_6px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[rgba(var(--brand-rgb),0.38)] hover:shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.22),0_14px_30px_rgba(0,0,0,0.42),0_0_24px_rgba(var(--brand-rgb),0.2)] sm:h-[228px] sm:flex-row">
      <section className="relative flex h-1/2 basis-1/2 items-center justify-center overflow-hidden rounded-t-[14px] bg-[#0B1424] p-4 sm:h-full sm:rounded-l-[14px] sm:rounded-tr-none">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--brand-rgb),0.22)_0%,rgba(var(--brand-rgb),0.08)_35%,transparent_75%)] opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-0 border border-[rgba(var(--brand-rgb),0.12)]" />
        <FileThumbnail file={file} />
      </section>

      <section className="flex h-1/2 basis-1/2 flex-col rounded-b-[14px] bg-[linear-gradient(155deg,#111C30,#0F172A)] p-4 sm:h-full sm:rounded-b-none sm:rounded-r-[14px] sm:border-l sm:border-white/10">
        <div className="min-w-0 space-y-1.5">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="block w-full truncate text-left text-[15px] font-medium text-slate-100 transition-colors hover:text-[var(--brand-color)]"
            title={file.original_name}
          >
            {file.original_name}
          </button>

          <div className="flex items-center gap-2 text-xs font-normal text-slate-400/90">
            <span>{mimeLabel(file?.mime_type)}</span>
            <span>•</span>
            <span>{formatBytes(file.size_bytes ?? file.compressed_size ?? 0)}</span>
            <span>•</span>
            <span>{timeAgo(file.created_at)}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPreview(file)}
            className="!h-9 !rounded-[10px] !border !border-[rgba(var(--brand-rgb),0.22)] !bg-transparent !text-slate-100 hover:!bg-[rgba(var(--brand-rgb),0.10)] hover:!border-[rgba(var(--brand-rgb),0.52)] hover:!shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.28),0_0_14px_rgba(var(--brand-rgb),0.24)] hover:scale-[1.02]"
          >
            Preview
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDownload(file.id)}
            loading={downloading === file.id}
            className="!h-9 !rounded-[10px] !border !border-[rgba(var(--brand-rgb),0.22)] !bg-transparent !text-slate-100 hover:!bg-[rgba(var(--brand-rgb),0.10)] hover:!border-[rgba(var(--brand-rgb),0.52)] hover:!shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.28),0_0_14px_rgba(var(--brand-rgb),0.24)] hover:scale-[1.02]"
          >
            Download
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onShare(file)}
            className="!h-9 !rounded-[10px] !border !border-[rgba(var(--brand-rgb),0.22)] !bg-transparent !text-slate-100 hover:!bg-[rgba(var(--brand-rgb),0.10)] hover:!border-[rgba(var(--brand-rgb),0.52)] hover:!shadow-[0_0_0_1px_rgba(var(--brand-rgb),0.28),0_0_14px_rgba(var(--brand-rgb),0.24)] hover:scale-[1.02]"
          >
            Share
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(file.id)}
            className="!h-9 !rounded-[10px] !border !border-red-400/35 !bg-transparent !text-red-300 hover:!bg-red-500/10 hover:!border-red-400/70 hover:!shadow-[0_0_0_1px_rgba(239,68,68,0.35),0_0_16px_rgba(239,68,68,0.28)] hover:scale-[1.02]"
          >
            Delete
          </Button>
        </div>
      </section>
    </article>
  );
}
