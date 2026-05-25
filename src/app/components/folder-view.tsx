import { useState, useEffect } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ArrowLeft, Upload, File, FileText, Image as ImageIcon, Video, Music, Trash2, Download, Plus, Grid, List } from 'lucide-react';
import { toast } from 'sonner';
import { FolderItem } from './folders';

interface FolderViewProps {
  token: string;
  folder: FolderItem;
  onBack: () => void;
}

interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
}

const acceptedFileTypes: { [key: string]: { [key: string]: string[] } } = {
  documents: {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'text/plain': ['.txt'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
  },
  images: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
  },
  videos: {
    'video/mp4': ['.mp4'],
    'video/quicktime': ['.mov'],
    'video/webm': ['.webm'],
  },
  apk: {
    'application/vnd.android.package-archive': ['.apk'],
  },
};

// Íconos grandes por tipo de archivo
function FileTypeIcon({ type, name, className = '' }: { type: string; name: string; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/')) return <ImageIcon className={`text-green-500 ${className}`} />;
  if (type.startsWith('video/')) return <Video className={`text-purple-500 ${className}`} />;
  if (type.startsWith('audio/')) return <Music className={`text-pink-500 ${className}`} />;
  if (type.includes('pdf')) return <FileText className={`text-red-500 ${className}`} />;
  if (['doc','docx'].includes(ext)) return <FileText className={`text-blue-500 ${className}`} />;
  if (['xls','xlsx'].includes(ext)) return <FileText className={`text-green-600 ${className}`} />;
  if (['zip','rar','7z'].includes(ext)) return <File className={`text-yellow-500 ${className}`} />;
  if (ext === 'apk') return <File className={`text-orange-500 ${className}`} />;
  return <File className={`text-muted-foreground ${className}`} />;
}

export function FolderView({ token, folder, onBack }: FolderViewProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [folder.id]);

  const loadFiles = async () => {
    try {
      const { files: data } = await api.getFiles(token, folder.id);
      setFiles(data.sort((a: FileItem, b: FileItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        setUploadProgress({ fileName: file.name, progress: 0 });

        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();

          // Simular progreso de lectura
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 60);
              setUploadProgress({ fileName: file.name, progress: pct });
            }
          };

          reader.onloadend = async () => {
            try {
              setUploadProgress({ fileName: file.name, progress: 70 });
              const base64 = reader.result as string;
              await api.uploadFile(token, folder.id, file.name, base64, file.size, file.type);
              setUploadProgress({ fileName: file.name, progress: 100 });
              setTimeout(() => setUploadProgress(null), 600);
              toast.success(`${file.name} subido correctamente`);
              await loadFiles();
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Error al subir ${file.name}`);
        setUploadProgress(null);
      }
    }
    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleUpload,
    accept: acceptedFileTypes[folder.type] || {},
    noClick: true,
    noKeyboard: true,
  });

  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      await api.deleteFile(token, folder.id, fileId);
      setFiles(files.filter(f => f.id !== fileId));
      toast.success(`${fileName} eliminado`);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar archivo');
    }
  };

  // Descarga con detección de plataforma
  const handleDownload = async (file: FileItem) => {
    setDownloadingId(file.id);
    const platform = Capacitor.getPlatform();

    try {
      if (platform === 'android' || platform === 'ios') {
        // Móvil: usar Filesystem de Capacitor
        toast.loading(`Descargando ${file.name}...`);

        const response = await fetch(file.url);
        const blob = await response.blob();

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        await Filesystem.writeFile({
          path: file.name,
          data: base64,
          directory: Directory.Documents,
          recursive: true,
        });

        toast.dismiss();
        toast.success(`${file.name} guardado en Documentos`);
      } else {
        // Web: crear blob URL
        toast.loading(`Descargando ${file.name}...`);
        const response = await fetch(file.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        toast.dismiss();
        toast.success(`${file.name} descargado`);
      }
    } catch (error) {
      console.error('Error downloading:', error);
      toast.dismiss();
      toast.error('Error al descargar el archivo');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div {...getRootProps()} className="h-full flex flex-col relative">
      <input {...getInputProps()} />

      {isDragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary rounded-2xl z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-xl font-semibold text-primary">Suelta los archivos aquí</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{folder.name}</h2>
            <p className="text-sm text-muted-foreground">
              {files.length} archivo{files.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Toggle vista */}
          <div className="flex gap-1 bg-accent rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-card shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={open}
          disabled={uploading}
          className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 justify-center"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Subir archivo
            </>
          )}
        </button>

        {/* Barra de progreso */}
        <AnimatePresence>
          {uploadProgress && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-3"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground truncate max-w-[70%]">{uploadProgress.fileName}</p>
                <p className="text-xs font-medium text-primary">{uploadProgress.progress}%</p>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${uploadProgress.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <File className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No hay archivos</h3>
            <p className="text-muted-foreground mb-4">
              Arrastra archivos aquí o haz clic en "Subir archivo"
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          // Vista grilla con miniaturas
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Miniatura */}
                  <div className="aspect-square bg-muted/50 flex items-center justify-center relative overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <FileTypeIcon type={file.type} name={file.name} className="w-12 h-12" />
                    )}
                    {/* Overlay acciones */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={downloadingId === file.id}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-all"
                      >
                        {downloadingId === file.id ? (
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.name)}
                        className="p-2 bg-red-500/70 backdrop-blur-sm rounded-lg hover:bg-red-500/90 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  {/* Nombre */}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          // Vista lista
          <div className="space-y-2">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded-lg" loading="lazy" />
                    ) : (
                      <FileTypeIcon type={file.type} name={file.name} className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} · {new Date(file.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={downloadingId === file.id}
                      className="p-2 hover:bg-accent rounded-lg transition-all"
                    >
                      {downloadingId === file.id ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <button
        onClick={open}
        disabled={uploading}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-110 transition-transform disabled:opacity-50 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}