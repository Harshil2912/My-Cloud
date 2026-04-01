import { useState, useEffect, useCallback } from 'react';
import { sharesApi } from '../api/sharesApi';

export function useShares() {
  const [myShares, setMyShares]           = useState([]);
  const [sharedWithMe, setSharedWithMe]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mine, withMe] = await Promise.all([
        sharesApi.listMine(),
        sharesApi.listSharedWithMe()
      ]);
      setMyShares(mine.data.shares ?? mine.data);
      setSharedWithMe(withMe.data.shares ?? withMe.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load shares');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const revokeShare = useCallback(async shareId => {
    await sharesApi.revoke(shareId);
    setMyShares(prev => prev.filter(s => s.id !== shareId));
  }, []);

  return { myShares, sharedWithMe, loading, error, refetch: fetchAll, revokeShare };
}
