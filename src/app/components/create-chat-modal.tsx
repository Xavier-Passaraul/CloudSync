import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Code2 } from 'lucide-react';

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChat: (name: string, type: string) => void;
}

const chatTypes = [
  { value: 'general', label: 'Chat común', icon: '💬', color: 'bg-gray-500' },
  { value: 'html', label: 'HTML', icon: '🌐', color: 'bg-orange-600' },
  { value: 'css', label: 'CSS', icon: '🎨', color: 'bg-blue-600' },
  { value: 'javascript', label: 'JavaScript', icon: '📜', color: 'bg-yellow-500' },
  { value: 'typescript', label: 'TypeScript', icon: '📘', color: 'bg-blue-700' },
  { value: 'react', label: 'React', icon: '⚛️', color: 'bg-cyan-500' },
  { value: 'nodejs', label: 'Node.js', icon: '🟢', color: 'bg-green-600' },
  { value: 'python', label: 'Python', icon: '🐍', color: 'bg-blue-500' },
  { value: 'php', label: 'PHP', icon: '🐘', color: 'bg-purple-600' },
  { value: 'java', label: 'Java', icon: '☕', color: 'bg-red-600' },
  { value: 'csharp', label: 'C#', icon: '#️⃣', color: 'bg-purple-700' },
  { value: 'cpp', label: 'C++', icon: '➕', color: 'bg-blue-800' },
  { value: 'sql', label: 'SQL', icon: '🗄️', color: 'bg-orange-500' },
  { value: 'json', label: 'JSON', icon: '📋', color: 'bg-green-500' },
  { value: 'bash', label: 'Bash', icon: '💻', color: 'bg-gray-700' },
  { value: 'other', label: 'Otros', icon: '📝', color: 'bg-gray-600' },
];

export function CreateChatModal({ isOpen, onClose, onCreateChat }: CreateChatModalProps) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateChat(name.trim(), selectedType);
    setName('');
    setSelectedType('general');
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
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
                <h2 className="text-2xl font-bold">Crear chat</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre del chat</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mi chat de snippets"
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Tipo de chat</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {chatTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setSelectedType(type.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                          selectedType === type.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 ${type.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                          {type.icon}
                        </div>
                        <span className="font-medium text-sm">{type.label}</span>
                      </button>
                    ))}
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
