import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Calendar as CalendarIconLucide, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import MainLayout from '@/components/layouts/MainLayout';

const Dashboard = () => {
  const [fecha, setFecha] = useState<Date>();
  const [hora, setHora] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [medico, setMedico] = useState('');
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fecha) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fecha",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('citas').insert({
        user_id: user?.id,
        fecha: format(fecha, 'yyyy-MM-dd'),
        hora,
        especialidad,
        medico,
        motivo,
        notas,
        estado: 'programada',
      });

      if (error) throw error;

      // Crear notificación
      await supabase.from('notificaciones').insert({
        user_id: user?.id,
        titulo: 'Cita registrada',
        mensaje: `Tu cita de ${especialidad} para el ${format(fecha, 'PPP', { locale: es })} ha sido registrada exitosamente.`,
        tipo: 'cita',
      });

      toast({
        title: "¡Cita registrada!",
        description: "Tu cita ha sido programada correctamente",
      });

      // Limpiar formulario
      setFecha(undefined);
      setHora('');
      setEspecialidad('');
      setMedico('');
      setMotivo('');
      setNotas('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la cita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Bienvenido a tu Portal Médico</h1>
          <p className="text-muted-foreground">Gestiona tus citas y mantente al día con tu salud</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/citas')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Citas Programadas</CardTitle>
              <CalendarIconLucide className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ver todas</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/documentos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Documentos</CardTitle>
              <FileText className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ver todos</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">Activo</div>
            </CardContent>
          </Card>
        </div>

        {/* Formulario de Registro de Citas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Registrar Nueva Cita</CardTitle>
            <CardDescription>
              Completa el formulario para programar tu próxima cita médica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Fecha de la Cita</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fecha && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fecha ? format(fecha, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover" align="start">
                      <Calendar
                        mode="single"
                        selected={fecha}
                        onSelect={setFecha}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Select value={especialidad} onValueChange={setEspecialidad} required>
                    <SelectTrigger id="especialidad">
                      <SelectValue placeholder="Selecciona una especialidad" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="medicina_general">Medicina General</SelectItem>
                      <SelectItem value="cardiologia">Cardiología</SelectItem>
                      <SelectItem value="dermatologia">Dermatología</SelectItem>
                      <SelectItem value="pediatria">Pediatría</SelectItem>
                      <SelectItem value="ginecologia">Ginecología</SelectItem>
                      <SelectItem value="odontologia">Odontología</SelectItem>
                      <SelectItem value="oftalmologia">Oftalmología</SelectItem>
                      <SelectItem value="traumatologia">Traumatología</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medico">Médico</Label>
                  <Input
                    id="medico"
                    type="text"
                    value={medico}
                    onChange={(e) => setMedico(e.target.value)}
                    required
                    placeholder="Dr. Juan Pérez"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo de la Consulta</Label>
                <Input
                  id="motivo"
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  required
                  placeholder="Consulta de rutina, dolor, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas Adicionales (Opcional)</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Cualquier información adicional que consideres importante"
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Cita'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;