import { useCallback, useState } from 'react';
import { useUpload } from '../../hooks/useUpload';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { formatBytes } from '../../utils/formatBytes';

export function UploadDropzone({ onSuccess }) {
  const { upload, uploading, progress, error, reset } = useUpload();
  const { addToast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [queuedFiles, setQueuedFiles] = useState([]);

  const queueFiles = useCallback(files => {
    if (!files.length) return;
    setQueuedFiles(prev => {
      const seen = new Set(prev.map(f => `${f.name}:${f.size}:${f.lastModified}`));
      const additions = files.filter(f => !seen.has(`${f.name}:${f.size}:${f.lastModified}`));
      return [...prev, ...additions];
    });
  }, []);

  const handleUploadQueue = useCallback(async () => {
    if (!queuedFiles.length) return;

    const failed = [];
    let uploadedCount = 0;

    for (const file of queuedFiles) {
      try {
        await upload(file);
        uploadedCount += 1;
        addToast(`"${file.name}" uploaded successfully`, 'success');
      } catch {
        failed.push(file);
        addToast(`Failed to upload "${file.name}"`, 'error');
      }
    }

    setQueuedFiles(failed);
    reset();
    if (uploadedCount > 0) onSuccess?.({ uploadedCount });
  }, [queuedFiles, upload, addToast, onSuccess, reset]);

  const onDrop = e => {
    e.preventDefault();
    setDragOver(false);
    queueFiles([...e.dataTransfer.files]);
  };

  const onFileInput = e => {
    queueFiles([...e.target.files]);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`upload-zone card-hover-lift relative flex cursor-pointer flex-col items-center justify-center p-12 transition-all duration-300 ${dragOver ? 'drag-over' : ''}`}
      onClick={() => document.getElementById('_upload_input').click()}
    >
      <input id="_upload_input" type="file" multiple className="hidden" onChange={onFileInput} />

      {uploading ? (
        <div className="w-full max-w-xs text-center">
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-300">Uploading… {progress}%</p>
          <div className="h-2 w-full rounded-full bg-white/10">
            <div className="neon-progress h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="mb-3 h-10 w-10 brand-neon-text" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V5" />
            <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
            <path d="M4 16.5v1A2.5 2.5 0 0 0 6.5 20h11a2.5 2.5 0 0 0 2.5-2.5v-1" />
          </svg>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drop files here or click to browse</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Max 5 GB per file</p>
          {queuedFiles.length > 0 && (
            <p className="mt-2 text-xs brand-neon-text-soft">{queuedFiles.length} file(s) queued</p>
          )}
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      {queuedFiles.length > 0 && !uploading && (
        <div
          className="glass-card mt-5 w-full max-w-lg p-3"
          onClick={e => e.stopPropagation()}
        >
          <ul className="max-h-40 space-y-1 overflow-auto text-left text-xs text-slate-600 dark:text-slate-300">
            {queuedFiles.map(file => (
              <li key={`${file.name}:${file.size}:${file.lastModified}`} className="flex items-center justify-between gap-3">
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-slate-500 dark:text-slate-400">{formatBytes(file.size)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setQueuedFiles([])}>Clear</Button>
            <Button size="sm" onClick={handleUploadQueue}>Upload {queuedFiles.length} file(s)</Button>
          </div>
        </div>
      )}
    </div>
  );
}
