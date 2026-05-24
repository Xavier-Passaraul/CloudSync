import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

// Create Supabase admin client
const getAdminClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

 // Create Supabase client with publishable key
const getAnonClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-3a8bcf27/health", (c) => {
  return c.json({ status: "ok" });
});

// Authentication Endpoints

// Sign up new user
app.post("/make-server-3a8bcf27/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required during signup" }, 400);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);
      return c.json({ error: `Failed to create user: ${error.message}` }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup request error: ${error}`);
    return c.json({ error: `Server error during signup: ${error.message}` }, 500);
  }
});

// Sign in user
app.post("/make-server-3a8bcf27/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required for signin" }, 400);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(`Signin error for ${email}: ${error.message}`);
      return c.json({ error: `Authentication failed: ${error.message}` }, 401);
    }

    return c.json({
      access_token: data.session?.access_token,
      user: data.user
    });
  } catch (error) {
    console.log(`Signin request error: ${error}`);
    return c.json({ error: `Server error during signin: ${error.message}` }, 500);
  }
});

// Folders Endpoints

// Create folder
app.post("/make-server-3a8bcf27/folders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const { name, icon, type } = await c.req.json();

    const folderId = crypto.randomUUID();
    const folderData = {
      id: folderId,
      userId: user.id,
      name,
      icon,
      type,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`folder:${user.id}:${folderId}`, folderData);
    return c.json({ folder: folderData });
  } catch (error) {
    console.log(`Create folder error: ${error}`);
    return c.json({ error: `Failed to create folder: ${error.message}` }, 500);
  }
});

// Get user folders
app.get("/make-server-3a8bcf27/folders", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const folders = await kv.getByPrefix(`folder:${user.id}:`);
    return c.json({ folders });
  } catch (error) {
    console.log(`Get folders error: ${error}`);
    return c.json({ error: `Failed to retrieve folders: ${error.message}` }, 500);
  }
});

// Delete folder
app.delete("/make-server-3a8bcf27/folders/:folderId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const folderId = c.req.param('folderId');

    // Delete all files in folder
    const files = await kv.getByPrefix(`file:${user.id}:${folderId}:`);
    for (const file of files) {
      await kv.del(`file:${user.id}:${folderId}:${file.id}`);
    }

    // Delete folder
    await kv.del(`folder:${user.id}:${folderId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete folder error: ${error}`);
    return c.json({ error: `Failed to delete folder: ${error.message}` }, 500);
  }
});

// Files Endpoints

// Upload file to folder
app.post("/make-server-3a8bcf27/files/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const { folderId, fileName, fileUrl, fileSize, fileType } = await c.req.json();

    const fileId = crypto.randomUUID();
    const fileData = {
      id: fileId,
      userId: user.id,
      folderId,
      name: fileName,
      url: fileUrl,
      size: fileSize,
      type: fileType,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`file:${user.id}:${folderId}:${fileId}`, fileData);
    return c.json({ file: fileData });
  } catch (error) {
    console.log(`File upload error: ${error}`);
    return c.json({ error: `Failed to upload file metadata: ${error.message}` }, 500);
  }
});

// Get files in folder
app.get("/make-server-3a8bcf27/files/:folderId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const folderId = c.req.param('folderId');
    const files = await kv.getByPrefix(`file:${user.id}:${folderId}:`);
    return c.json({ files });
  } catch (error) {
    console.log(`Get files error: ${error}`);
    return c.json({ error: `Failed to retrieve files: ${error.message}` }, 500);
  }
});

// Delete file
app.delete("/make-server-3a8bcf27/files/:folderId/:fileId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const folderId = c.req.param('folderId');
    const fileId = c.req.param('fileId');
    await kv.del(`file:${user.id}:${folderId}:${fileId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete file error: ${error}`);
    return c.json({ error: `Failed to delete file: ${error.message}` }, 500);
  }
});

// Chat Endpoints

// Create chat room
app.post("/make-server-3a8bcf27/chats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const { name, type } = await c.req.json();

    const chatId = crypto.randomUUID();
    const chatData = {
      id: chatId,
      userId: user.id,
      name,
      type,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`chat:${user.id}:${chatId}`, chatData);
    return c.json({ chat: chatData });
  } catch (error) {
    console.log(`Create chat error: ${error}`);
    return c.json({ error: `Failed to create chat: ${error.message}` }, 500);
  }
});

// Get user chats
app.get("/make-server-3a8bcf27/chats", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const chats = await kv.getByPrefix(`chat:${user.id}:`);
    return c.json({ chats });
  } catch (error) {
    console.log(`Get chats error: ${error}`);
    return c.json({ error: `Failed to retrieve chats: ${error.message}` }, 500);
  }
});

// Delete chat
app.delete("/make-server-3a8bcf27/chats/:chatId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const chatId = c.req.param('chatId');

    // Delete all messages in chat
    const messages = await kv.getByPrefix(`message:${user.id}:${chatId}:`);
    for (const message of messages) {
      await kv.del(`message:${user.id}:${chatId}:${message.id}`);
    }

    // Delete chat
    await kv.del(`chat:${user.id}:${chatId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete chat error: ${error}`);
    return c.json({ error: `Failed to delete chat: ${error.message}` }, 500);
  }
});

// Chat Messages Endpoints

// Send message to chat
app.post("/make-server-3a8bcf27/messages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const { chatId, content, fileUrl, fileName, fileType } = await c.req.json();

    const messageId = crypto.randomUUID();
    const messageData = {
      id: messageId,
      userId: user.id,
      chatId,
      content,
      fileUrl,
      fileName,
      fileType,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`message:${user.id}:${chatId}:${messageId}`, messageData);
    return c.json({ message: messageData });
  } catch (error) {
    console.log(`Send message error: ${error}`);
    return c.json({ error: `Failed to send message: ${error.message}` }, 500);
  }
});

// Get messages in chat
app.get("/make-server-3a8bcf27/messages/:chatId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const chatId = c.req.param('chatId');
    const messages = await kv.getByPrefix(`message:${user.id}:${chatId}:`);
    return c.json({ messages });
  } catch (error) {
    console.log(`Get messages error: ${error}`);
    return c.json({ error: `Failed to retrieve messages: ${error.message}` }, 500);
  }
});

// Delete message
app.delete("/make-server-3a8bcf27/messages/:chatId/:messageId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    const chatId = c.req.param('chatId');
    const messageId = c.req.param('messageId');
    await kv.del(`message:${user.id}:${chatId}:${messageId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete message error: ${error}`);
    return c.json({ error: `Failed to delete message: ${error.message}` }, 500);
  }
});

// Delete all user data
app.delete("/make-server-3a8bcf27/user/delete-all", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (!user?.id || authError) {
      return c.json({ error: "Unauthorized - invalid or missing access token" }, 401);
    }

    // Delete all folders and their files
    const folders = await kv.getByPrefix(`folder:${user.id}:`);
    for (const folder of folders) {
      const files = await kv.getByPrefix(`file:${user.id}:${folder.id}:`);
      for (const file of files) {
        await kv.del(`file:${user.id}:${folder.id}:${file.id}`);
      }
      await kv.del(`folder:${user.id}:${folder.id}`);
    }

    // Delete all chats and their messages
    const chats = await kv.getByPrefix(`chat:${user.id}:`);
    for (const chat of chats) {
      const messages = await kv.getByPrefix(`message:${user.id}:${chat.id}:`);
      for (const message of messages) {
        await kv.del(`message:${user.id}:${chat.id}:${message.id}`);
      }
      await kv.del(`chat:${user.id}:${chat.id}`);
    }

    // Delete user account
    await supabase.auth.admin.deleteUser(user.id);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Delete all user data error: ${error}`);
    return c.json({ error: `Failed to delete all user data: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);