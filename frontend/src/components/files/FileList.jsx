import { useState } from 'react';
import { FileCard } from './FileCard';
import { Spinner } from '../ui/Spinner';
import { filesApi } from '../../api/filesApi';
import { useToast } from '../ui/Toast';
import { FilePreviewModal } from './FilePreviewModal';
import mammoth from 'mammoth';
import JSZip from 'jszip';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function extractSlideText(xml = '') {
  return xml
    .replace(/<a:br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function previewDocx(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value?.trim() || 'No readable text found in this DOCX file.';
}

async function previewPptx(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideNames = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const chunks = [];
  for (const [idx, slideName] of slideNames.entries()) {
    const xml = await zip.file(slideName)?.async('text');
    const text = extractSlideText(xml || '');
    if (text) chunks.push(`Slide ${idx + 1}\n${text}`);
  }

  return chunks.join('\n\n').trim() || 'No readable text found in this PPTX file.';
}

export function FileList({ files, loading, error, onRefresh, onOpenShare }) {
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [previewing, setPreviewing]   = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewData, setPreviewData] = useState({ type: null, url: null, text: '' });
  const { addToast } = useToast();

  const handleDownload = async fileId => {
    setDownloading(fileId);
    try {
      const res = await filesApi.download(fileId);
      const blob = new Blob([res.data]);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      // Try to get filename from Content-Disposition header
      const cd   = res.headers['content-disposition'] ?? '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download  = match?.[1] ?? `file-${fileId}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      addToast('Download failed', 'error');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async fileId => {
    if (!window.confirm('Delete this file? This cannot be undone.')) return;
    setDeleting(fileId);
    try {
      await filesApi.deleteFile(fileId);
      onRefresh();
      addToast('File deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handlePreview = async file => {
    if (previewData.url) URL.revokeObjectURL(previewData.url);
    setPreviewing(true);
    setPreviewFile(file);
    setPreviewError(null);
    setPreviewData({ type: null, url: null, text: '' });

    try {
      const res = await filesApi.preview(file.id);
      const mimeRaw = (res.headers['content-type'] || file.mime_type || 'application/octet-stream').toLowerCase();
      const mime = mimeRaw.split(';')[0].trim();
      const blob = new Blob([res.data], { type: mime });

      if (mime.startsWith('image/') || mime.startsWith('application/pdf')) {
        const url = URL.createObjectURL(blob);
        setPreviewData({ type: mime, url, text: '' });
        return;
      }

      if (mime === DOCX_MIME) {
        const text = await previewDocx(blob);
        setPreviewData({ type: 'docx', url: null, text: text.slice(0, 15000) });
        return;
      }

      if (mime === PPTX_MIME) {
        const text = await previewPptx(blob);
        setPreviewData({ type: 'pptx', url: null, text: text.slice(0, 15000) });
        return;
      }

      if (mime.startsWith('text/')) {
        const text = await blob.text();
        setPreviewData({ type: mime, url: null, text: text.slice(0, 5000) });
        return;
      }

      setPreviewError('Preview is not available for this file type. You can still download it.');
    } catch {
      setPreviewError('Failed to load preview');
    }
  };

  const closePreview = () => {
    if (previewData.url) URL.revokeObjectURL(previewData.url);
    setPreviewing(false);
    setPreviewFile(null);
    setPreviewError(null);
    setPreviewData({ type: null, url: null, text: '' });
  };

  if (loading) return (
    <div className="glass-card flex justify-center py-16"><Spinner /></div>
  );

  if (error) return (
    <p className="glass-card py-8 text-center text-red-500">{error}</p>
  );

  if (!files.length) return (
    <p className="glass-card py-16 text-center text-slate-500 dark:text-slate-400">No files yet. Upload your first file!</p>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {files.map(file => (
        <FileCard
          key={file.id}
          file={file}
          onDownload={handleDownload}
          onPreview={handlePreview}
          onShare={onOpenShare}
          onDelete={handleDelete}
          downloading={downloading}
        />
      ))}
      <FilePreviewModal
        open={previewing}
        file={previewFile}
        data={previewData}
        error={previewError}
        onClose={closePreview}
        onDownload={() => previewFile && handleDownload(previewFile.id)}
      />
    </div>
  );
}
