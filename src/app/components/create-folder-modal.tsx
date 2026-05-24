import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Folder, FileText, Image, Video, Package } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, icon: string, type: string) => void;
}

const folderTypes = [
  { value: 'documents', label: 'PDF / Documentos', icon: FileText, color: 'bg-blue-500' },
  { value: 'images', label: 'Imágenes', icon: Image, color: 'bg-green-500' },
  { value: 'videos', label: 'Videos', icon: Video, color: 'bg-purple-500' },
  { value: 'apk', label: 'APK', icon: Package, color: 'bg-orange-500' },
];

const folderIcons = [
  { name: 'Folder', icon: Folder },
  { name: 'FileText', icon: FileText },
  { name: 'Image', icon: Image },
  { name: 'Video', icon: Video },
  { name: 'Package', icon: Package },
];

export function CreateFolderModal({ isOpen, onClose, onCreateFolder }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [selectedType, setSelectedType] = useState('documents');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateFolder(name.trim(), selectedIcon, selectedType);
    setName('');
    setSelectedIcon('Folder');
    setSelectedType('documents');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-2xl font-bold">Crear carpeta</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la carpeta</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mi carpeta"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Icono de carpeta</label>
                  <div className="grid grid-cols-5 gap-2">
                    {folderIcons.map((icon) => {
                      const Icon = icon.icon;
                      return (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => setSelectedIcon(icon.name)}
                          className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                            selectedIcon === icon.name
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-6 h-6 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Tipo de carpeta</label>
                  <div className="space-y-2">
                    {folderTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setSelectedType(type.value)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                            selectedType === type.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
