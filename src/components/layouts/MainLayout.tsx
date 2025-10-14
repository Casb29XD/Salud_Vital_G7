import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, FileText, Home, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

const MainLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchNotificaciones = async () => {
      const { data } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotificaciones(data);
        setUnreadCount(data.filter((n) => !n.leida).length);
      }
    };

    fetchNotificaciones();

    // Suscribirse a notificaciones en tiempo real
    const channel = supabase
      .channel('notificaciones')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotificaciones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const marcarComoLeida = async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const NavItems = () => (
    <nav className="flex flex-col gap-2">
      <Button
        variant="ghost"
        className="justify-start gap-3"
        onClick={() => navigate('/')}
      >
        <Home className="h-5 w-5" />
        Inicio
      </Button>
      <Button
        variant="ghost"
        className="justify-start gap-3"
        onClick={() => navigate('/citas')}
      >
        <Calendar className="h-5 w-5" />
        Mis Citas
      </Button>
      <Button
        variant="ghost"
        className="justify-start gap-3"
        onClick={() => navigate('/documentos')}
      >
        <FileText className="h-5 w-5" />
        Documentos
      </Button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="py-4">
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>
            <h2 className="text-xl font-bold">Portal Médico</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80">
                <div className="py-4">
                  <h3 className="font-semibold text-lg mb-4">Notificaciones</h3>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    <div className="space-y-3">
                      {notificaciones.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No tienes notificaciones
                        </p>
                      ) : (
                        notificaciones.map((notif) => (
                          <Card
                            key={notif.id}
                            className={`cursor-pointer transition-colors ${
                              !notif.leida ? 'bg-accent/10' : ''
                            }`}
                            onClick={() => marcarComoLeida(notif.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{notif.titulo}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notif.mensaje}
                                  </p>
                                </div>
                                {!notif.leida && (
                                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-6 px-4">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <NavItems />
              </CardContent>
            </Card>
          </aside>

          {/* Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;