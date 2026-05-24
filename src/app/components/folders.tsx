import { useState, useEffect } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, FileText, Image as ImageIcon, Video, Package, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface FoldersProps {
  token: string;
  onOpenFolder: (folder: FolderItem) => void;
}

export interface FolderItem {
  id: string;
  name: string;
  icon: string;
  type: string;
  createdAt: string;
}

const iconMap: { [key: string]: any } = {
  Folder,
  FileText,
  Image: ImageIcon,
  Video,
  Package,
};

const typeColors: { [key: string]: string } = {
  documents: 'bg-blue-500',
  images: 'bg-green-500',
  videos: 'bg-purple-500',
  apk: 'bg-orange-500',
};

const typeLabels: { [key: string]: string } = {
  documents: 'PDF / Documentos',
  images: 'Imágenes',
  videos: 'Videos',
  apk: 'APK',
};

export function Folders({ token, onOpenFolder }: FoldersProps) {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileCounts, setFileCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const { folders: data } = await api.getFolders(token);
      const sortedFolders = data.sort((a: FolderItem, b: FolderItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFolders(sortedFolders);

      // Load file counts for each folder
      const counts: { [key: string]: number } = {};
      for (const folder of sortedFolders) {
        try {
          const { files } = await api.getFiles(token, folder.id);
          counts[folder.id] = files.length;
        } catch {
          counts[folder.id] = 0;
        }
      }
      setFileCounts(counts);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Error al cargar carpetas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, folderId: string, folderName: string) => {
    e.stopPropagation();

    if (!confirm(`¿Estás seguro de eliminar "${folderName}"? Se eliminarán todos los archivos dentro.`)) {
      return;
    }

    try {
      await api.deleteFolder(token, folderId);
      setFolders(folders.filter(f => f.id !== folderId));
      toast.success(`${folderName} eliminada`);
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Error al eliminar carpeta');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center mb-6">
          <FolderOpen className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">No hay carpetas</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Crea tu primera carpeta para organizar tus archivos por tipo
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {folders.map((folder) => {
          const Icon = iconMap[folder.icon] || Folder;
          const colorClass = typeColors[folder.type] || 'bg-gray-500';

          return (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onOpenFolder(folder)}
              className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center text-white`}>
                  <Icon className="w-7 h-7" />
                </div>
                <button
                  onClick={(e) => handleDelete(e, folder.id, folder.name)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-lg mb-1 truncate">{folder.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{typeLabels[folder.type]}</p>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {fileCounts[folder.id] || 0} archivo{fileCounts[folder.id] !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(folder.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
