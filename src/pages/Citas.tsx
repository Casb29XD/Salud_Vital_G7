import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

interface Cita {
  id: string;
  fecha: string;
  hora: string;
  especialidad: string;
  medico: string;
  motivo: string;
  estado: string;
  notas: string | null;
}

const Citas = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const { data, error } = await supabase
          .from('citas')
          .select('*')
          .eq('user_id', user?.id)
          .order('fecha', { ascending: true });

        if (error) throw error;
        setCitas(data || []);
      } catch (error) {
        console.error('Error fetching citas:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCitas();
    }
  }, [user]);

  const getEstadoBadge = (estado: string) => {
    const variants = {
      programada: 'default',
      completada: 'secondary',
      cancelada: 'destructive',
    };
    return variants[estado as keyof typeof variants] || 'default';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Citas</h1>
          <p className="text-muted-foreground mt-2">
            Consulta y gestiona todas tus citas médicas programadas
          </p>
        </div>

        {citas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes citas programadas</h3>
              <p className="text-muted-foreground text-center">
                Registra tu primera cita desde el panel principal
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {citas.map((cita) => (
              <Card key={cita.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{cita.especialidad}</CardTitle>
                      <CardDescription>{cita.motivo}</CardDescription>
                    </div>
                    <Badge variant={getEstadoBadge(cita.estado) as any}>
                      {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(cita.fecha), 'PPP', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{cita.hora}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-primary" />
                      <span>{cita.medico}</span>
                    </div>
                    {cita.notas && (
                      <div className="flex items-center gap-2 text-sm md:col-span-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">{cita.notas}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Citas;