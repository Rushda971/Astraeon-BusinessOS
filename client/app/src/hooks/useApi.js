import { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export function useApi(path, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await apiRequest(path, options);
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [path]);

  return { data, loading, error };
}
