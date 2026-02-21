import { useState, useEffect, useCallback } from 'react';
import { getFileTree, getFileList, getFileContent, saveFileContent } from '../api/client';

export function useFiles() {
  const [tree, setTree] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTree = useCallback(async () => {
    try {
      const data = await getFileTree();
      setTree(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      const data = await getFileList();
      setFiles(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTree(), loadFiles()]);
    setLoading(false);
  }, [loadTree, loadFiles]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tree, files, loading, error, refresh };
}

export function useFileContent(path) {
  const [content, setContent] = useState('');
  const [mtime, setMtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!path) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getFileContent(path);
      setContent(data.content);
      setMtime(data.mtime);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  const save = useCallback(async (newContent) => {
    if (!path) return false;
    
    setSaving(true);
    
    try {
      await saveFileContent(path, newContent);
      setContent(newContent);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { content, mtime, loading, error, saving, save, reload: load };
}
