import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function FilePreviewModal({ open, file, data, error, onClose, onDownload }) {
  const title = file?.original_name || 'Preview';

  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!error && data?.type?.startsWith('image/') && data.url && (
          <img src={data.url} alt={title} className="mx-auto max-h-[70vh] w-auto rounded-lg" />
        )}

        {!error && data?.type === 'application/pdf' && data.url && (
          <iframe
            title={title}
            src={data.url}
            className="h-[70vh] w-full rounded-lg border border-gray-200 dark:border-gray-700"
          />
        )}

        {!error && data?.type?.startsWith('text/') && (
          <pre className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-3 text-xs text-gray-700 dark:text-gray-200">
            {data.text || 'No preview text available.'}
          </pre>
        )}

        {!error && (data?.type === 'docx' || data?.type === 'pptx') && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Text preview extracted from {data.type.toUpperCase()} file. Layout and media are not rendered.
            </p>
            <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 p-3 text-xs text-gray-700 dark:text-gray-200">
              {data.text || 'No preview text available.'}
            </pre>
          </div>
        )}

        {!error && !data?.type && (
          <p className="text-sm text-gray-500">Loading preview...</p>
        )}

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
          <Button size="sm" variant="secondary" onClick={onDownload}>Download</Button>
        </div>
      </div>
    </Modal>
  );
}