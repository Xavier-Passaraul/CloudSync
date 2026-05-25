import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, FileText, Image as ImageIcon, Video, Package, Trash2, FolderOpen, X } from 'lucide-react';
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
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);
  const [contextMenu, setContextMenu] = useState<FolderItem | null>(null);
  const longPressTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadFolders = async () => {
    try {
      const { folders: data } = await api.getFolders(token);
      const sortedFolders = data.sort((a: FolderItem, b: FolderItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setFolders(sortedFolders);

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

  const handleDelete = async (folder: FolderItem) => {
    try {
      await api.deleteFolder(token, folder.id);
      setFolders(folders.filter(f => f.id !== folder.id));
      toast.success(`${folder.name} eliminada`);
      setFolderToDelete(null);
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Error al eliminar carpeta');
    }
  };

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, folder: FolderItem) => {
    longPressTimers.current[folder.id] = setTimeout(() => {
      setContextMenu(folder);
    }, 300);
  };

  const handleLongPressEnd = (folderId: string) => {
    if (longPressTimers.current[folderId]) {
      clearTimeout(longPressTimers.current[folderId]);
      delete longPressTimers.current[folderId];
    }
  };

  const handleClick = (folder: FolderItem) => {
    if (!contextMenu) {
      onOpenFolder(folder);
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
    <>
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
                onClick={() => handleClick(folder)}
                onTouchStart={(e) => handleLongPressStart(e, folder)}
                onTouchEnd={() => handleLongPressEnd(folder.id)}
                onTouchMove={() => handleLongPressEnd(folder.id)}
                onMouseDown={(e) => handleLongPressStart(e, folder)}
                onMouseUp={() => handleLongPressEnd(folder.id)}
                onMouseLeave={() => handleLongPressEnd(folder.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu(folder);
                }}
                className={`bg-card border rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all group select-none ${
                  contextMenu?.id === folder.id ? 'border-primary shadow-md' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center text-white`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToDelete(folder);
                    }}
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

      {/* Sheet long press */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContextMenu(null)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
              <p className="font-semibold text-center mb-6 truncate">{contextMenu.name}</p>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setFolderToDelete(contextMenu);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-destructive/10 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Eliminar carpeta</p>
                    <p className="text-xs text-muted-foreground">Se eliminarán todos los archivos</p>
                  </div>
                </button>

                <button
                  onClick={() => setContextMenu(null)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-accent transition-all text-left"
                >
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">Cancelar</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal confirmar eliminación */}
      <AnimatePresence>
        {folderToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFolderToDelete(null)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">¿Eliminar carpeta?</h2>
                <p className="text-center text-muted-foreground text-sm mb-6">
                  Se eliminarán todos los archivos de <span className="font-medium text-foreground">"{folderToDelete.name}"</span>. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFolderToDelete(null)}
                    className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(folderToDelete)}
                    className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}