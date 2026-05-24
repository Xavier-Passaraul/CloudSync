import { useState, useEffect } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { ArrowLeft, Upload, File, FileText, Image as ImageIcon, Video, Music, Trash2, Download, Plus } from 'lucide-react';
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

export function FolderView({ token, folder, onBack }: FolderViewProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await api.uploadFile(token, folder.id, file.name, base64, file.size, file.type);
          toast.success(`${file.name} subido correctamente`);
          await loadFiles();
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Error al subir ${file.name}`);
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

  // Descarga real compatible con móvil y APK
  const handleDownload = async (file: FileItem) => {
    try {
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
    } catch (error) {
      toast.dismiss();
      toast.error('Error al descargar el archivo');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (type.includes('pdf') || type.includes('text')) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
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

      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">{folder.name}</h2>
            <p className="text-sm text-muted-foreground">
              {files.length} archivo{files.length !== 1 ? 's' : ''}
            </p>
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
      </div>

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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(file.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex-1 bg-accent text-accent-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-all"
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