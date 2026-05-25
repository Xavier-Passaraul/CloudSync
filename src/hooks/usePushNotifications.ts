import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../utils/supabase';
import { toast } from 'sonner';

export function usePushNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId || Capacitor.getPlatform() === 'web') return;

    const registerPush = async () => {
      try {
        // Pedir permiso
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') return;

        // Registrar con FCM
        await PushNotifications.register();

        // Cuando FCM devuelve el token, guardarlo en Supabase
        await PushNotifications.addListener('registration', async (token) => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            await supabase.from('device_tokens').upsert({
              user_id: userId,
              token: token.value,
              platform: Capacitor.getPlatform(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,token',
            });
          } catch (err) {
            console.error('Error saving push token:', err);
          }
        });

        // Error de registro
        await PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err);
        });

        // Notificación recibida con app ABIERTA
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          toast(notification.title || 'CloudSync', {
            description: notification.body,
            duration: 4000,
          });
        });

        // Usuario tocó la notificación
        await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Notification tapped:', action.notification);
        });

      } catch (err) {
        console.error('Error setting up push notifications:', err);
      }
    };

    registerPush();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [userId]);
}