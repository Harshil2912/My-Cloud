import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../api/filesApi';

export function useFiles({ page = 1, limit = 20 } = {}) {
  const [files, setFiles]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await filesApi.list({ page, limit });
      setFiles(res.data.files ?? res.data);
      setTotal(res.data.total ?? res.data.length);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const deleteFile = useCallback(async fileId => {
    await filesApi.deleteFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setTotal(prev => prev - 1);
  }, []);

  return { files, total, loading, error, refetch: fetchFiles, deleteFile };
}
