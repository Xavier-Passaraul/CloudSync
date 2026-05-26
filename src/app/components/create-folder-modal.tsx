import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, icon: string, type: string) => void;
}

// Íconos Material Symbols SVG inline para las carpetas
const materialIcons: { name: string; label: string; svg: JSX.Element }[] = [
  { name: 'folder', label: 'Carpeta', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg> },
  { name: 'folder_open', label: 'Abierta', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg> },
  { name: 'description', label: 'Documento', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8zm0-4h4v2H8z"/></svg> },
  { name: 'image', label: 'Imagen', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg> },
  { name: 'videocam', label: 'Video', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg> },
  { name: 'android', label: 'Android', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.3-.16-.65-.06-.83.22l-1.88 3.24C14.97 8.33 13.54 8 12 8s-2.97.33-4.47.91L5.65 5.67c-.19-.28-.55-.37-.83-.22-.3.16-.42.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg> },
  { name: 'work', label: 'Trabajo', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.54 15.76.3 13.16.3c-1.33 0-2.6.52-3.54 1.47L8 3.39 6.38 1.77C5.44.82 4.17.3 2.84.3.24.3-2 2.54-2 5.14c0 .48.11.92.18 1.36H-4v14c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3.79c.55-.55 1.27-.91 2.01-.91 1.33 0 2.49 1.07 2.49 2.5 0 .48-.17.99-.44 1.41-.38.59-.98.99-1.66.99h-5.4l3-4zm-6 0C7.55 2.66 8 3.34 8 4.14c0 1.43-1.16 2.5-2.49 2.5-.68 0-1.28-.4-1.66-.99-.27-.42-.44-.93-.44-1.41C3.41 2.81 4.57 1.74 5.9 1.74c.74 0 1.46.36 2.01.91L8 2.76l.09-.09zM4 18v-9h16v9H4z"/></svg> },
  { name: 'cloud', label: 'Nube', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg> },
  { name: 'star', label: 'Favorito', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> },
  { name: 'lock', label: 'Privado', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg> },
  { name: 'music_note', label: 'Música', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg> },
  { name: 'code', label: 'Código', svg: <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg> },
];

const folderTypes = [
  { value: 'documents', label: 'PDF / Documentos', color: 'bg-blue-500', desc: 'PDF, Word, Excel, TXT' },
  { value: 'images', label: 'Imágenes', color: 'bg-green-500', desc: 'JPG, PNG, GIF, WEBP' },
  { value: 'videos', label: 'Videos', color: 'bg-purple-500', desc: 'MP4, MOV, WEBM' },
  { value: 'apk', label: 'APK', color: 'bg-orange-500', desc: 'Archivos Android' },
];

export function CreateFolderModal({ isOpen, onClose, onCreateFolder }: CreateFolderModalProps) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('documents');
  const [selectedIcon, setSelectedIcon] = useState('folder');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateFolder(name.trim(), selectedIcon, selectedType);
    setName('');
    setSelectedType('documents');
    setSelectedIcon('folder');
    onClose();
  };

  const selectedTypeData = folderTypes.find(t => t.value === selectedType);
  const selectedIconData = materialIcons.find(i => i.name === selectedIcon);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-2xl font-bold">Crear carpeta</h2>
                <button onClick={onClose} className="p-2 hover:bg-accent rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Preview */}
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className={`w-14 h-14 ${selectedTypeData?.color || 'bg-blue-500'} rounded-2xl flex items-center justify-center text-white`}>
                    {selectedIconData?.svg}
                  </div>
                  <div>
                    <p className="font-medium">{name || 'Mi carpeta'}</p>
                    <p className="text-xs text-muted-foreground">{selectedTypeData?.label}</p>
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de la carpeta</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Mi carpeta"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    autoFocus required />
                </div>

                {/* Selector de ícono */}
                <div>
                  <label className="block text-sm font-medium mb-3">Ícono</label>
                  <div className="grid grid-cols-6 gap-2">
                    {materialIcons.map((icon) => (
                      <button key={icon.name} type="button" onClick={() => setSelectedIcon(icon.name)}
                        title={icon.label}
                        className={`p-3 rounded-xl border-2 transition-all hover:scale-105 flex items-center justify-center ${
                          selectedIcon === icon.name ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}>
                        {icon.svg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium mb-3">Tipo de carpeta</label>
                  <div className="space-y-2">
                    {folderTypes.map((type) => (
                      <button key={type.value} type="button" onClick={() => setSelectedType(type.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.01] ${
                          selectedType === type.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}>
                        <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center text-white`}>
                          {materialIcons.find(i => i.name === selectedIcon)?.svg}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.desc}</p>
                        </div>
                        {selectedType === type.value && (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={onClose}
                    className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={!name.trim()}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50">
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