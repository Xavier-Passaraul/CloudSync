import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, MessageSquare, Menu, LogOut, Moon, Sun, User as UserIcon, Trash2, Bell, BellOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Auth } from './components/auth';
import { Folders } from './components/folders';
import { FolderView } from './components/folder-view';
import { Chats } from './components/chats';
import { ChatView } from './components/chat-view';
import { Profile } from './components/profile';
import { CreateFolderModal } from './components/create-folder-modal';
import { CreateChatModal } from './components/create-chat-modal';
import { supabase, api } from '../utils/supabase';
import { useBackButton } from '../hooks/useBackButton';
import { usePushNotifications } from '../hooks/usePushNotifications';

import type { FolderItem } from './components/folders';
import type { ChatItem } from './components/chats';

type View = 'folders' | 'folder-detail' | 'chats' | 'chat-detail' | 'profile';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setToken(session.access_token);
        setUser(session.user);
      }
      setLoading(false);
    };

    checkSession();

    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleAuth = (accessToken: string, userData: any) => {
    setToken(accessToken);
    setUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <>
        <Auth onAuth={handleAuth} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <>
      <Dashboard
        token={token}
        user={user}
        setUser={setUser}
        onLogout={handleLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <Toaster position="top-center" richColors />
    </>
  );
}

interface DashboardProps {
  token: string;
  user: any;
  setUser: (user: any) => void;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

function Dashboard({ token, user, setUser, onLogout, darkMode, toggleDarkMode }: DashboardProps) {
  const [view, setView] = useState<View>('folders');
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showCreateChatModal, setShowCreateChatModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  useBackButton();
  usePushNotifications(user?.id || null);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success('Notificaciones activadas');
      new Notification('CloudSync', {
        body: 'Notificaciones activadas correctamente',
        icon: '/icon.png',
      });
    } else {
      toast.error('Permiso de notificaciones denegado');
    }
  };

  const handleOpenFolder = (folder: FolderItem) => {
    setSelectedFolder(folder);
    setView('folder-detail');
  };

  const handleBackFromFolder = () => {
    setSelectedFolder(null);
    setView('folders');
    setRefreshKey(prev => prev + 1);
  };

  const handleOpenChat = (chat: ChatItem) => {
    setSelectedChat(chat);
    setView('chat-detail');
  };

  const handleBackFromChat = () => {
    setSelectedChat(null);
    setView('chats');
    setRefreshKey(prev => prev + 1);
  };

  const handleCreateFolder = async (name: string, icon: string, type: string) => {
    try {
      await api.createFolder(token, name, icon, type);
      toast.success('Carpeta creada correctamente');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCreateChat = async (name: string, type: string) => {
    try {
      await api.createChat(token, name, type);
      toast.success('Chat creado correctamente');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await api.deleteAllUserData(token);
      toast.success('Todos los datos han sido eliminados');
      onLogout();
    } catch (error: any) {
      toast.error('Error al eliminar los datos');
    }
  };

  const handleShowChats = () => {
    setView('chats');
    setShowMenu(false);
  };

  const handleShowFolders = () => {
    setView('folders');
    setShowMenu(false);
  };

  const handleShowProfile = () => {
    setView('profile');
    setShowMenu(false);
  };

  const handleBackToFolders = () => {
    setView('folders');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="hcg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5ecfdf"/>
                    <stop offset="100%" stopColor="#1a6a7a"/>
                  </linearGradient>
                </defs>
                <path d="M6,25 Q5,31 10,32 L30,32 Q35,32 35,27 Q35,22 30,21 Q31,17 28,14 Q24,10 19,12 Q17,7 12,6 Q6,4 4,10 Q2,16 7,20 Q4,21 6,25 Z"
                  fill="none" stroke="url(#hcg)" strokeWidth="1.8" strokeLinejoin="round"/>
                <text x="20" y="27" textAnchor="middle"
                  fontFamily="-apple-system,sans-serif"
                  fontSize="14" fontWeight="300"
                  fill="url(#hcg)">S</text>
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold">CloudSync</h1>
              <p className="text-xs text-muted-foreground">Tu nube personal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground hidden sm:inline">Sincronizado</span>
        </div>
      </div>

      {/* Menu lateral */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } }}
              exit={{ opacity: 0, x: -300, transition: { duration: 0.18, ease: [0.55, 0.06, 0.68, 0.19] } }}
              className="fixed top-0 left-0 h-full w-80 bg-card border-r border-border shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="mcg" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#5ecfdf"/>
                          <stop offset="100%" stopColor="#1a6a7a"/>
                        </linearGradient>
                      </defs>
                      <path d="M7,30 Q6,38 13,39 L36,39 Q43,39 43,32 Q43,26 36,25 Q38,20 34,16 Q29,11 23,13 Q20,7 14,6 Q6,4 4,12 Q2,19 8,24 Q4,25 7,30 Z"
                        fill="none" stroke="url(#mcg)" strokeWidth="2" strokeLinejoin="round"/>
                      <text x="24" y="33" textAnchor="middle"
                        fontFamily="-apple-system,sans-serif"
                        fontSize="17" fontWeight="300"
                        fill="url(#mcg)">S</text>
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold">CloudSync</h2>
                    <p className="text-xs text-muted-foreground">Menú principal</p>
                  </div>
                </div>

                <div className="bg-accent rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {user?.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.user_metadata?.name || user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button
                  onClick={handleShowProfile}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-accent transition-all text-left"
                >
                  <UserIcon className="w-5 h-5" />
                  Mi Perfil
                </button>

                <button
                  onClick={() => {
                    if (notificationsEnabled) {
                      setNotificationsEnabled(false);
                      toast.success('Notificaciones desactivadas');
                    } else {
                      requestNotificationPermission();
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-accent transition-all text-left"
                >
                  {notificationsEnabled ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  {notificationsEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
                </button>

                <div className="border-t border-border my-2" />

                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium hover:bg-accent transition-all text-left"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {darkMode ? 'Modo claro' : 'Modo oscuro'}
                </button>

                <div className="border-t border-border my-2" />

                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-destructive hover:bg-destructive/10 transition-all text-left"
                >
                  <Trash2 className="w-5 h-5" />
                  Eliminar todos los datos
                </button>
              </div>

              <div className="p-4 border-t border-border">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Buscador y botones */}
      {(view === 'folders' || view === 'chats') && (
        <div className="p-6 border-b border-border">
          <div className="flex gap-3 flex-col sm:flex-row mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={view === 'folders' ? 'Buscar carpetas...' : 'Buscar chats...'}
                className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {view === 'folders' && (
              <>
                <button
                  onClick={handleShowChats}
                  className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 justify-center"
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat
                </button>

                <button
                  onClick={() => setShowCreateFolderModal(true)}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 justify-center"
                >
                  <Plus className="w-5 h-5" />
                  Crear carpeta
                </button>
              </>
            )}

            {view === 'chats' && (
              <>
                <button
                  onClick={handleShowFolders}
                  className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 justify-center"
                >
                  Carpetas
                </button>

                <button
                  onClick={() => setShowCreateChatModal(true)}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-all flex items-center gap-2 justify-center"
                >
                  <Plus className="w-5 h-5" />
                  Crear chat
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        {view === 'folders' && (
          <div className="h-full p-6 overflow-y-auto">
            <Folders key={refreshKey} token={token} onOpenFolder={handleOpenFolder} />
          </div>
        )}

        {view === 'folder-detail' && selectedFolder && (
          <FolderView token={token} folder={selectedFolder} onBack={handleBackFromFolder} />
        )}

        {view === 'chats' && (
          <div className="h-full p-6 overflow-y-auto">
            <Chats key={refreshKey} token={token} onOpenChat={handleOpenChat} />
          </div>
        )}

        {view === 'chat-detail' && selectedChat && (
          <ChatView token={token} chat={selectedChat} onBack={handleBackFromChat} />
        )}

        {view === 'profile' && (
          <Profile
            token={token}
            user={user}
            onBack={handleBackToFolders}
            onUpdateUser={setUser}
          />
        )}
      </div>

      {/* Modales */}
      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      <CreateChatModal
        isOpen={showCreateChatModal}
        onClose={() => setShowCreateChatModal(false)}
        onCreateChat={handleCreateChat}
      />

      {/* Modal eliminar datos */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-destructive" />
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">¿Eliminar todos los datos?</h2>
                <p className="text-center text-muted-foreground mb-6">
                  Esta acción es permanente y no se puede deshacer. Se eliminarán todas tus carpetas, archivos, chats y mensajes.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteAllData}
                    className="flex-1 px-6 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium hover:opacity-90 transition-all"
                  >
                    Eliminar todo
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;