import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Send, Paperclip, Trash2, Copy, Download, File, Image as ImageIcon, Code2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ChatItem } from './chats';

interface ChatViewProps {
  token: string;
  chat: ChatItem;
  onBack: () => void;
}

interface Message {
  id: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
}

interface ContextMenu {
  messageId: string;
  content?: string;
  visible: boolean;
}

const languageMap: { [key: string]: string } = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  csharp: 'csharp',
  cpp: 'cpp',
  php: 'php',
  html: 'html',
  css: 'css',
  sql: 'sql',
  json: 'json',
  bash: 'shell',
  react: 'javascript',
  nodejs: 'javascript',
};

export function ChatView({ token, chat, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isCodeMode, setIsCodeMode] = useState(chat.type !== 'general');
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadMessages();
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cerrar menu al tocar fuera
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const { messages: data } = await api.getMessages(token, chat.id);
      setMessages(data.sort((a: Message, b: Message) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.sendMessage(token, chat.id, newMessage.trim());
      setNewMessage('');
      await loadMessages();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleSendFile = async (files: File[]) => {
    if (files.length === 0) return;

    setSending(true);
    for (const file of files) {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await api.sendMessage(token, chat.id, undefined, base64, file.name, file.type);
          toast.success(`${file.name} enviado`);
          await loadMessages();
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error sending file:', error);
        toast.error(`Error al enviar ${file.name}`);
      }
    }
    setSending(false);
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: handleSendFile,
    noClick: true,
    noKeyboard: true,
  });

  const handleDelete = async (messageId: string) => {
    try {
      await api.deleteMessage(token, chat.id, messageId);
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success('Mensaje eliminado');
      setShowDeleteModal(false);
      setMessageToDelete(null);
      setContextMenu(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Error al eliminar mensaje');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
    setContextMenu(null);
  };

  // Long press handlers
  const handleLongPressStart = (msg: Message) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        messageId: msg.id,
        content: msg.content,
        visible: true,
      });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const language = languageMap[chat.type] || 'javascript';

  return (
    <div {...getRootProps()} className="h-full flex flex-col">
      <input {...getInputProps()} />

      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-accent rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-bold">{chat.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                {chat.type} • {messages.length} mensaje{messages.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {chat.type !== 'general' && (
            <button
              onClick={() => setIsCodeMode(!isCodeMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isCodeMode ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
              }`}
            >
              <Code2 className="w-5 h-5" />
              {isCodeMode ? 'Modo código' : 'Modo texto'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4 text-3xl">💬</div>
            <h3 className="text-xl font-semibold mb-2">No hay mensajes</h3>
            <p className="text-muted-foreground max-w-sm">
              Envía tu primer mensaje o arrastra archivos para empezar
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
                onTouchStart={() => handleLongPressStart(msg)}
                onTouchEnd={handleLongPressEnd}
                onTouchMove={handleLongPressEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ messageId: msg.id, content: msg.content, visible: true });
                }}
              >
                <div className={`bg-card border rounded-2xl overflow-hidden hover:shadow-md transition-all ${
                  contextMenu?.messageId === msg.id ? 'border-primary shadow-md' : 'border-border'
                }`}>
                  {msg.content && (
                    <div className="relative">
                      {isCodeMode && chat.type !== 'general' ? (
                        <div className="relative">
                          <div className="absolute top-2 right-2 z-10 flex gap-2">
                            <button
                              onClick={() => handleCopy(msg.content!)}
                              className="p-2 bg-card/80 backdrop-blur-sm hover:bg-accent rounded-lg transition-all"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <Editor
                            height="auto"
                            defaultLanguage={language}
                            value={msg.content}
                            theme="vs-dark"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                              lineNumbers: 'on',
                              folding: false,
                              automaticLayout: true,
                              wordWrap: 'on',
                              padding: { top: 16, bottom: 16 },
                            }}
                            onMount={(editor) => {
                              const lineCount = editor.getModel()?.getLineCount() || 1;
                              const height = Math.min(Math.max(lineCount * 19 + 32, 100), 600);
                              editor.getDomNode()!.style.height = `${height}px`;
                              editor.layout();
                            }}
                          />
                        </div>
                      ) : (
                        <div className="p-4">
                          <pre className="flex-1 whitespace-pre-wrap break-words font-sans text-sm">
                            {msg.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.fileUrl && (
                    <div className="p-4 border-t border-border">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          {msg.fileType?.startsWith('image/') ? (
                            <ImageIcon className="w-5 h-5" />
                          ) : (
                            <File className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{msg.fileName}</p>
                          <p className="text-xs text-muted-foreground">{msg.fileType}</p>
                        </div>
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName}
                          className="p-2 hover:bg-accent rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      {new Date(msg.createdAt).toLocaleString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">Mantené presionado para opciones</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Modal opciones (long press) */}
      <AnimatePresence>
        {contextMenu?.visible && (
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
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

              <div className="space-y-2">
                {contextMenu.content && (
                  <button
                    onClick={() => handleCopy(contextMenu.content!)}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-accent transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Copy className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Copiar</p>
                      <p className="text-xs text-muted-foreground">Copiar texto al portapapeles</p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMessageToDelete(contextMenu.messageId);
                    setShowDeleteModal(true);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-destructive/10 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Eliminar</p>
                    <p className="text-xs text-muted-foreground">Eliminar este mensaje</p>
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
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">¿Eliminar mensaje?</h2>
                <p className="text-center text-muted-foreground text-sm mb-6">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => messageToDelete && handleDelete(messageToDelete)}
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

      <div className="p-6 border-t border-border bg-card">
        <form onSubmit={handleSendText} className="flex gap-3">
          <button
            type="button"
            onClick={open}
            disabled={sending}
            className="px-4 py-3 bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            {isCodeMode && chat.type !== 'general' ? (
              <div className="border border-border rounded-xl overflow-hidden">
                <Editor
                  height="120px"
                  defaultLanguage={language}
                  value={newMessage}
                  onChange={(value) => setNewMessage(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'off',
                    folding: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    padding: { top: 12, bottom: 12 },
                  }}
                />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                className="w-full px-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none min-h-[50px] max-h-[200px]"
                rows={1}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}