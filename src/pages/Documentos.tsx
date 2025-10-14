import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Pill, FlaskConical, File } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import MainLayout from '@/components/layouts/MainLayout';

interface Documento {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha_documento: string;
  created_at: string;
}

const Documentos = () => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDocumentos = async () => {
      try {
        const { data, error } = await supabase
          .from('documentos_medicos')
          .select('*')
          .eq('user_id', user?.id)
          .order('fecha_documento', { ascending: false });

        if (error) throw error;
        setDocumentos(data || []);
      } catch (error) {
        console.error('Error fetching documentos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDocumentos();
    }
  }, [user]);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'orden_medica':
        return <FileText className="h-5 w-5" />;
      case 'medicamento':
        return <Pill className="h-5 w-5" />;
      case 'resultado_laboratorio':
        return <FlaskConical className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getTipoBadge = (tipo: string) => {
    const labels = {
      orden_medica: 'Orden Médica',
      medicamento: 'Medicamento',
      resultado_laboratorio: 'Resultado Lab.',
      otro: 'Otro',
    };
    return labels[tipo as keyof typeof labels] || tipo;
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
          <h1 className="text-3xl font-bold text-foreground">Mis Documentos Médicos</h1>
          <p className="text-muted-foreground mt-2">
            Accede a tus órdenes médicas, medicamentos y resultados de laboratorio
          </p>
        </div>

        {documentos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes documentos aún</h3>
              <p className="text-muted-foreground text-center">
                Tus documentos médicos aparecerán aquí cuando sean agregados por tu proveedor de salud
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentos.map((documento) => (
              <Card key={documento.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {getIcon(documento.tipo)}
                    </div>
                    <Badge variant="secondary">{getTipoBadge(documento.tipo)}</Badge>
                  </div>
                  <CardTitle className="mt-4 line-clamp-2">{documento.titulo}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {documento.descripcion || 'Sin descripción'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Fecha: {format(new Date(documento.fecha_documento), 'PPP', { locale: es })}
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

export default Documentos;