'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Trash2, Upload, RotateCw, HardDrive, AlertTriangle, Loader2 } from 'lucide-react';

interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

export default function AdminBackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const fetchBackups = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/backups');
      setBackups(data.data || []);
    } catch {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const { data } = await api.post('/admin/backup');
      toast.success(data.data?.message || 'Backup created');
      await fetchBackups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/backups/${encodeURIComponent(deleteTarget)}`);
      toast.success('Backup deleted');
      setDeleteTarget(null);
      await fetchBackups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete backup');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = useCallback(async (filename: string) => {
    try {
      const response = await api.get(`/admin/backups/${encodeURIComponent(filename)}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download backup');
    }
  }, []);

  const handleRestore = async () => {
    if (!restoreFile || restoreConfirm !== 'RESTORE') return;
    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup', restoreFile);
      const { data } = await api.post('/admin/backups/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 1800000,
      });
      toast.success(data.data?.message || 'Database restored successfully');
      setRestoreDialogOpen(false);
      setRestoreFile(null);
      setRestoreConfirm('');
      await fetchBackups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore database');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Database Backup</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, download, and restore database backups</p>
        </div>
        <Button onClick={handleCreateBackup} disabled={creating}>
          <RotateCw className={`h-4 w-4 mr-1.5 ${creating ? 'animate-spin' : ''}`} />
          {creating ? 'Creating...' : 'Create Backup'}
        </Button>
      </div>

      {/* Backups List */}
      <div className="premium-card-static">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Existing Backups
          </h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />)}
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No backups found. Click &quot;Create Backup&quot; to get started.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {backups.map((backup) => (
              <div key={backup.filename} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <HardDrive className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{backup.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {backup.sizeFormatted} &middot; {new Date(backup.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(backup.filename)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(backup.filename)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Section */}
      <div className="premium-card-static">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/50">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Restore Database
          </h2>
        </div>
        <div className="p-5">
          <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
            {restoreFile ? (
              <div className="space-y-3">
                <HardDrive className="h-8 w-8 mx-auto text-blue-500" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{restoreFile.name}</p>
                <p className="text-xs text-muted-foreground">{(restoreFile.size / 1024 / 1024).toFixed(1)} MB</p>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setRestoreFile(null); setRestoreConfirm(''); }}>
                    Change File
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRestoreDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">.sql.gz files only</p>
                <input
                  type="file"
                  accept=".sql.gz"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.name.endsWith('.sql.gz')) {
                        toast.error('Only .sql.gz files are supported');
                        return;
                      }
                      setRestoreFile(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Backup"
        message={`Are you sure you want to delete "${deleteTarget}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteBackup}
      />

      {/* Restore Confirm Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={(v) => { if (!restoring) setRestoreDialogOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Dangerous Action</p>
                <p className="text-xs mt-1">This will overwrite your entire database with the backup. All current data will be lost. This cannot be undone.</p>
              </div>
            </div>
            {restoreFile && (
              <p className="text-sm text-muted-foreground">
                Restoring: <strong>{restoreFile.name}</strong> ({(restoreFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Type <span className="font-mono font-bold text-red-600 dark:text-red-400">RESTORE</span> to confirm
              </label>
              <input
                type="text"
                value={restoreConfirm}
                onChange={(e) => setRestoreConfirm(e.target.value)}
                placeholder="RESTORE"
                className="premium-input h-10 px-3 text-sm w-full"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setRestoreDialogOpen(false); setRestoreFile(null); setRestoreConfirm(''); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRestore}
                disabled={restoreConfirm !== 'RESTORE' || restoring}
              >
                {restoring ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                {restoring ? 'Restoring...' : 'Restore Database'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
