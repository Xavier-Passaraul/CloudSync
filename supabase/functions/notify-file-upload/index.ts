import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!;

serve(async (req) => {
  try {
    const body = await req.json();

    // Payload que viene del webhook de Supabase Storage
    const { record } = body;
    if (!record) return new Response('No record', { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Obtener el user_id del archivo subido
    // El path del archivo tiene formato: {user_id}/{folder_id}/{filename}
    const pathParts = record.name?.split('/');
    const userId = pathParts?.[0];
    if (!userId) return new Response('No user_id', { status: 400 });

    const fileName = pathParts?.[pathParts.length - 1] || 'archivo';

    // Obtener todos los tokens del usuario
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId);

    if (error || !tokens?.length) {
      return new Response('No tokens found', { status: 200 });
    }

    // Enviar notificación a cada token via FCM
    const notifications = tokens.map(async ({ token }) => {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${FCM_SERVER_KEY}`,
        },
        body: JSON.stringify({
          to: token,
          notification: {
            title: 'CloudSync',
            body: `Se subió un nuevo archivo: ${fileName}`,
            icon: 'ic_launcher',
            sound: 'default',
          },
          data: {
            type: 'file_upload',
            fileName,
            userId,
          },
        }),
      });

      return response.json();
    });

    await Promise.all(notifications);

    return new Response(
      JSON.stringify({ success: true, notified: tokens.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});