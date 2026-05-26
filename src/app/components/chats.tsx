import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, X } from 'lucide-react';
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

const devIconMap: { [key: string]: string } = {
  html: 'html5/html5-original.svg',
  css: 'css3/css3-original.svg',
  javascript: 'javascript/javascript-original.svg',
  typescript: 'typescript/typescript-original.svg',
  react: 'react/react-original.svg',
  nodejs: 'nodejs/nodejs-original.svg',
  python: 'python/python-original.svg',
  php: 'php/php-original.svg',
  java: 'java/java-original.svg',
  csharp: 'csharp/csharp-original.svg',
  cpp: 'cplusplus/cplusplus-original.svg',
  sql: 'mysql/mysql-original.svg',
  json: 'json/json-original.svg',
  bash: 'bash/bash-plain.svg?v=2',

};


const LangIcon = ({ type }: { type: string }) => {
  if (type === 'general') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-foreground">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    );
  }

  if (devIconMap[type]) {
    return (
      <img
        src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${devIconMap[type]}`}
        alt={type}
        className="w-8 h-8"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-foreground">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
    </svg>
  );
};

export function Chats({ token, onOpenChat }: ChatsProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageCounts, setMessageCounts] = useState<{ [key: string]: number }>({});
  const [chatToDelete, setChatToDelete] = useState<ChatItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ChatItem | null>(null);
  const longPressTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadChats = async () => {
    try {
      const { chats: data } = await api.getChats(token);
      const sortedChats = data.sort((a: ChatItem, b: ChatItem) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setChats(sortedChats);

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

  const handleDelete = async (chat: ChatItem) => {
    try {
      await api.deleteChat(token, chat.id);
      setChats(chats.filter(c => c.id !== chat.id));
      toast.success(`${chat.name} eliminado`);
      setChatToDelete(null);
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Error al eliminar chat');
    }
  };

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent, chat: ChatItem) => {
    longPressTimers.current[chat.id] = setTimeout(() => {
      setContextMenu(chat);
    }, 300);
  };

  const handleLongPressEnd = (chatId: string) => {
    if (longPressTimers.current[chatId]) {
      clearTimeout(longPressTimers.current[chatId]);
      delete longPressTimers.current[chatId];
    }
  };

  const handleClick = (chat: ChatItem) => {
    if (!contextMenu) {
      onOpenChat(chat);
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleClick(chat)}
              onTouchStart={(e) => handleLongPressStart(e, chat)}
              onTouchEnd={() => handleLongPressEnd(chat.id)}
              onTouchMove={() => handleLongPressEnd(chat.id)}
              onMouseDown={(e) => handleLongPressStart(e, chat)}
              onMouseUp={() => handleLongPressEnd(chat.id)}
              onMouseLeave={() => handleLongPressEnd(chat.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu(chat);
              }}
              className={`bg-card border rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all group select-none ${
                contextMenu?.id === chat.id ? 'border-primary shadow-md' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <LangIcon type={chat.type} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatToDelete(chat);
                  }}
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
          ))}
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
                    setChatToDelete(contextMenu);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-destructive/10 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Eliminar chat</p>
                    <p className="text-xs text-muted-foreground">Se eliminarán todos los mensajes</p>
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
        {chatToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatToDelete(null)}
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
                <h2 className="text-xl font-bold text-center mb-2">¿Eliminar chat?</h2>
                <p className="text-center text-muted-foreground text-sm mb-6">
                  Se eliminarán todos los mensajes de <span className="font-medium text-foreground">"{chatToDelete.name}"</span>. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setChatToDelete(null)}
                    className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(chatToDelete)}
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