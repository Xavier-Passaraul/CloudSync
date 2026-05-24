import { useState } from 'react';
import { api } from '../../utils/supabase';
import { motion } from 'motion/react';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

interface AuthProps {
  onAuth: (token: string, user: any) => void;
}

export function Auth({ onAuth }: AuthProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Validar contraseña
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }

        await api.signup(email, password, name);
        const { access_token, user } = await api.signin(email, password);
        onAuth(access_token, user);
      } else {
        const { access_token, user } = await api.signin(email, password);
        onAuth(access_token, user);
      }
    } catch (err: any) {
      // Mensajes de error más claros
      if (err.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos. ¿Necesitas crear una cuenta?');
      } else if (err.message.includes('User already registered')) {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Por favor confirma tu email antes de iniciar sesión.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4">
      {/* Banner informativo */}
      {!isSignup && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 max-w-2xl mx-auto z-50"
        >
          <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-xl">
            <p className="text-sm font-medium text-center">
              💡 <strong>¿Primera vez?</strong> Necesitas crear una cuenta antes de iniciar sesión.{' '}
              <button
                onClick={() => setIsSignup(true)}
                className="underline hover:no-underline font-bold"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-foreground rounded-lg" />
            </div>
            <h1 className="text-3xl font-bold mb-2">CloudSync</h1>
            <p className="text-muted-foreground">
              {isSignup ? 'Crea tu cuenta personal' : 'Bienvenido de vuelta'}
            </p>
            {!isSignup && (
              <div className="mt-4 p-3 bg-accent/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  ¿Primera vez? <button
                    type="button"
                    onClick={() => setIsSignup(true)}
                    className="text-primary font-medium hover:underline"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-2">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-input-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {isSignup && password.length > 0 && password.length < 6 && (
                <p className="text-xs text-destructive mt-1">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              )}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl text-sm"
              >
                <p className="font-medium mb-1">⚠️ Error</p>
                <p>{error}</p>
                {!isSignup && error.includes('incorrectos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(true);
                      setError('');
                    }}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    ¿No tienes cuenta? Regístrate aquí
                  </button>
                )}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : isSignup ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignup ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <span className="font-medium text-primary">
                {isSignup ? 'Inicia sesión' : 'Regístrate'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
