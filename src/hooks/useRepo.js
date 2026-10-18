import { useCallback, useEffect, useState } from 'react';

/**
 * Memuat daftar dari repo dan memuat ulang otomatis ketika data berubah (mis. setelah CRUD di admin).
 * Mengembalikan { data, loading, error, reload }.
 */
export function useRepoList(repo, params) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params);

  useEffect(() => repo.subscribe(() => setTick((n) => n + 1)), [repo]);

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    repo
      .list(JSON.parse(key))
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => {
      alive = false;
    };
  }, [repo, key, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload };
}

export function useRepoItem(repo, id) {
  const [state, setState] = useState({ item: null, loading: true, error: null });
  useEffect(() => {
    let alive = true;
    setState({ item: null, loading: true, error: null });
    repo
      .get(id)
      .then((item) => alive && setState({ item, loading: false, error: null }))
      .catch((error) => alive && setState({ item: null, loading: false, error }));
    return () => {
      alive = false;
    };
  }, [repo, id]);
  return state;
}
