import { useState, useEffect } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatsProps {
  token: string;
  onOpenChat: (chat: ChatItem) => void;
}

export interface ChatItem {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

const chatIcons: { [key: string]: string } = {
  general: '💬',
  html: '🌐',
  css: '🎨',
  javascript: '📜',
  typescript: '📘',
  react: '⚛️',
  nodejs: '🟢',
  python: '🐍',
  php: '🐘',
  java: '☕',
  csharp: '#️⃣',
  cpp: '➕',
  sql: '🗄️',
  json: '📋',
  bash: '💻',
  other: '📝',
};

const chatColors: { [key: string]: string } = {
  general: 'bg-gray-500',
  html: 'bg-orange-600',
  css: 'bg-blue-600',
  javascript: 'bg-yellow-500',
  typescript: 'bg-blue-700',
  react: 'bg-cyan-500',
  nodejs: 'bg-green-600',
  python: 'bg-blue-500',
  php: 'bg-purple-600',
  java: 'bg-red-600',
  csharp: 'bg-purple-700',
  cpp: 'bg-blue-800',
  sql: 'bg-orange-500',
  json: 'bg-green-500',
  bash: 'bg-gray-700',
  other: 'bg-gray-600',
};

export function Chats({ token, onOpenChat }: ChatsProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageCounts, setMessageCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const { chats: data } = await api.getChats(token);
      const sortedChats = data.sort((a: ChatItem, b: ChatItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setChats(sortedChats);

      // Load message counts for each chat
      const counts: { [key: string]: number } = {};
      for (const chat of sortedChats) {
        try {
          const { messages } = await api.getMessages(token, chat.id);
          counts[chat.id] = messages.length;
        } catch {
          counts[chat.id] = 0;
        }
      }
      setMessageCounts(counts);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Error al cargar chats');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, chatId: string, chatName: string) => {
    e.stopPropagation();

    if (!confirm(`¿Estás seguro de eliminar "${chatName}"? Se eliminarán todos los mensajes.`)) {
      return;
    }

    try {
      await api.deleteChat(token, chatId);
      setChats(chats.filter(c => c.id !== chatId));
      toast.success(`${chatName} eliminado`);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Error al eliminar chat');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center mb-6 text-4xl">
          💬
        </div>
        <h3 className="text-2xl font-semibold mb-2">No hay chats</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Crea tu primer chat para guardar snippets de código, notas rápidas o enlaces
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {chats.map((chat) => {
          const icon = chatIcons[chat.type] || '💬';
          const colorClass = chatColors[chat.type] || 'bg-gray-500';

          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onOpenChat(chat)}
              className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 ${colorClass} rounded-2xl flex items-center justify-center text-white text-2xl`}>
                  {icon}
                </div>
                <button
                  onClick={(e) => handleDelete(e, chat.id, chat.name)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold text-lg mb-1 truncate">{chat.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 capitalize">{chat.type}</p>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {messageCounts[chat.id] || 0} mensaje{messageCounts[chat.id] !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.createdAt).toLocaleDateString('es-ES', {
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
