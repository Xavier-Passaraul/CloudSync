import { useState, useRef } from 'react';
import { ArrowLeft, Camera, User, Mail, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileProps {
  token: string;
  user: any;
  onBack: () => void;
  onUpdateUser: (userData: any) => void;
}

export function Profile({ token, user, onBack, onUpdateUser }: ProfileProps) {
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email] = useState(user?.email || '');
  const [profileImage, setProfileImage] = useState(user?.user_metadata?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          name,
          avatar_url: profileImage,
        },
      };

      onUpdateUser(updatedUser);
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const removeProfileImage = () => {
    setProfileImage('');
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">Mi Perfil</h2>
            <p className="text-sm text-muted-foreground">Gestiona tu información personal</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Foto de perfil */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {profileImage ? (
                <div className="relative">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-border"
                  />
                  <button
                    onClick={removeProfileImage}
                    className="absolute top-0 right-0 p-2 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center border-4 border-border">
                  <User className="w-16 h-16 text-muted-foreground" />
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-3 bg-primary text-primary-foreground rounded-full hover:scale-110 transition-transform shadow-lg"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <p className="mt-4 text-sm text-muted-foreground">
              Haz clic en el ícono de cámara para cambiar tu foto
            </p>
          </div>

          {/* Información personal */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Información Personal</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-xl outline-none text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    El email no puede ser modificado
                  </p>
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}