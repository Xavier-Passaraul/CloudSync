import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { toast } from 'sonner';

export function useBackButton() {
  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    const handler = App.addListener('backButton', () => {
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        App.exitApp();
      } else {
        lastBackPress.current = now;
        toast('Presioná de nuevo para salir', {
          duration: 2000,
          position: 'bottom-center',
        });
      }
    });

    return () => {
      handler.then(h => h.remove());
    };
  }, []);
}