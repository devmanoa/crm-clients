import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText, Image, File as FileIcon } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-[var(--k-danger)]" />;
  return <FileIcon className="w-5 h-5 text-[var(--k-muted)]" />;
}

export default function FileUpload({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMB = 10,
  accept,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    setError(null);
    const toAdd: File[] = [];

    for (const file of Array.from(newFiles)) {
      if (files.length + toAdd.length >= maxFiles) {
        setError(`Maximum ${maxFiles} fichiers`);
        break;
      }
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" depasse ${maxSizeMB} Mo`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" : type de fichier non autorise`);
        continue;
      }
      // Avoid duplicates by name+size
      if (files.some(f => f.name === file.name && f.size === file.size)) continue;

      toAdd.push(file);

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviews(prev => ({ ...prev, [file.name + file.size]: url }));
      }
    }

    if (toAdd.length > 0) {
      onChange([...files, ...toAdd]);
    }
  }, [files, onChange, maxFiles, maxSizeBytes, maxSizeMB]);

  const removeFile = useCallback((index: number) => {
    const file = files[index];
    const key = file.name + file.size;
    if (previews[key]) {
      URL.revokeObjectURL(previews[key]);
      setPreviews(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    onChange(files.filter((_, i) => i !== index));
    setError(null);
  }, [files, onChange, previews]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
          dragActive
            ? 'border-[var(--k-primary)] bg-[var(--k-primary-2)]'
            : 'border-[var(--k-border)] hover:border-[var(--k-muted)] bg-[var(--k-surface-2)] hover:brightness-95'
        }`}
      >
        <Upload className={`w-6 h-6 ${dragActive ? 'text-[var(--k-primary)]' : 'text-[var(--k-muted)]'}`} />
        <div className="text-center">
          <p className="text-sm text-[var(--k-muted)]">
            <span className="font-medium text-[var(--k-primary)]">Cliquer pour ajouter</span> ou glisser-deposer
          </p>
          <p className="text-xs text-[var(--k-muted)] mt-1">
            Max {maxFiles} fichiers, {maxSizeMB} Mo chacun
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[var(--k-danger)]">{error}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const key = file.name + file.size;
            const preview = previews[key];
            return (
              <li
                key={key}
                className="flex items-center gap-3 p-2 bg-[var(--k-surface)] border border-[var(--k-border)] rounded-xl"
              >
                {/* Thumbnail or icon */}
                {preview ? (
                  <img src={preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[var(--k-surface-2)] flex items-center justify-center flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--k-text)] truncate">{file.name}</p>
                  <p className="text-xs text-[var(--k-muted)]">{formatFileSize(file.size)}</p>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 p-1 text-[var(--k-muted)] hover:text-[var(--k-danger)] rounded-lg hover:bg-red-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
