import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3a8bcf27`;

export const api = {
  // Auth - Using Supabase Auth directly
  signup: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) throw new Error(error.message);
    return { user: data.user };
  },

  signin: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw new Error(error.message);
    return {
      access_token: data.session?.access_token,
      user: data.user
    };
  },

  // Folders
  createFolder: async (token: string, name: string, icon: string, type: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, icon, type })
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Create folder error:', error);
      throw new Error(error.error || 'Failed to create folder');
    }
    return res.json();
  },

  getFolders: async (token: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Get folders error:', error);
      throw new Error(error.error || 'Failed to get folders');
    }
    return res.json();
  },

  deleteFolder: async (token: string, folderId: string) => {
    const res = await fetch(`${API_BASE}/folders/${folderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete folder error:', error);
      throw new Error(error.error || 'Failed to delete folder');
    }
    return res.json();
  },

  // Files
  uploadFile: async (token: string, folderId: string, fileName: string, fileUrl: string, fileSize: number, fileType: string) => {
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ folderId, fileName, fileUrl, fileSize, fileType })
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Upload file error:', error);
      throw new Error(error.error || 'Upload failed');
    }
    return res.json();
  },

  getFiles: async (token: string, folderId: string) => {
    const res = await fetch(`${API_BASE}/files/${folderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Get files error:', error);
      throw new Error(error.error || 'Failed to get files');
    }
    return res.json();
  },

  deleteFile: async (token: string, folderId: string, fileId: string) => {
    const res = await fetch(`${API_BASE}/files/${folderId}/${fileId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete file error:', error);
      throw new Error(error.error || 'Failed to delete file');
    }
    return res.json();
  },

  // Chats
  createChat: async (token: string, name: string, type: string) => {
    const res = await fetch(`${API_BASE}/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, type })
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Create chat error:', error);
      throw new Error(error.error || 'Failed to create chat');
    }
    return res.json();
  },

  getChats: async (token: string) => {
    const res = await fetch(`${API_BASE}/chats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Get chats error:', error);
      throw new Error(error.error || 'Failed to get chats');
    }
    return res.json();
  },

  deleteChat: async (token: string, chatId: string) => {
    const res = await fetch(`${API_BASE}/chats/${chatId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete chat error:', error);
      throw new Error(error.error || 'Failed to delete chat');
    }
    return res.json();
  },

  // Messages
  sendMessage: async (token: string, chatId: string, content?: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ chatId, content, fileUrl, fileName, fileType })
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Send message error:', error);
      throw new Error(error.error || 'Failed to send message');
    }
    return res.json();
  },

  getMessages: async (token: string, chatId: string) => {
    const res = await fetch(`${API_BASE}/messages/${chatId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Get messages error:', error);
      throw new Error(error.error || 'Failed to get messages');
    }
    return res.json();
  },

  deleteMessage: async (token: string, chatId: string, messageId: string) => {
    const res = await fetch(`${API_BASE}/messages/${chatId}/${messageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete message error:', error);
      throw new Error(error.error || 'Failed to delete message');
    }
    return res.json();
  },

  // User
  deleteAllUserData: async (token: string) => {
    const res = await fetch(`${API_BASE}/user/delete-all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const error = await res.json();
      console.error('Delete all user data error:', error);
      throw new Error(error.error || 'Failed to delete all user data');
    }
    return res.json();
  },
};
