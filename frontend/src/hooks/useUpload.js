import { useState, useRef, useCallback } from 'react';
import { filesApi } from '../api/filesApi';

export function useUpload() {
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);
  const abortRef                  = useRef(null);

  const upload = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const res = await filesApi.upload(file, pct => setProgress(pct));
      setResult(res.data);
      return res.data;
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      setError(err.response?.data?.error || err.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
    setResult(null);
  }, []);

  return { upload, uploading, progress, error, result, reset };
}
