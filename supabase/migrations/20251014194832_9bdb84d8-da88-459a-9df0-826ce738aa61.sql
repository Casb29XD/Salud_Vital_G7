-- Tabla de perfiles de usuario con información de documento
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('CC', 'TI', 'CE', 'Pasaporte')),
  numero_documento TEXT NOT NULL UNIQUE,
  fecha_expedicion DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_completo, tipo_documento, numero_documento, fecha_expedicion)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo_documento', 'CC'),
    COALESCE(NEW.raw_user_meta_data->>'numero_documento', ''),
    COALESCE((NEW.raw_user_meta_data->>'fecha_expedicion')::date, CURRENT_DATE)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabla de citas médicas
CREATE TABLE public.citas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  especialidad TEXT NOT NULL,
  medico TEXT NOT NULL,
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias citas"
  ON public.citas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias citas"
  ON public.citas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias citas"
  ON public.citas FOR UPDATE
  USING (auth.uid() = user_id);

-- Tabla de documentos médicos
CREATE TABLE public.documentos_medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('orden_medica', 'medicamento', 'resultado_laboratorio', 'otro')),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  archivo_url TEXT,
  fecha_documento DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.documentos_medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propios documentos"
  ON public.documentos_medicos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios documentos"
  ON public.documentos_medicos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Tabla de notificaciones
CREATE TABLE public.notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cita', 'documento', 'recordatorio', 'general')),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias notificaciones"
  ON public.notificaciones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias notificaciones"
  ON public.notificaciones FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_citas_updated_at
  BEFORE UPDATE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_citas_user_id ON public.citas(user_id);
CREATE INDEX idx_citas_fecha ON public.citas(fecha);
CREATE INDEX idx_documentos_user_id ON public.documentos_medicos(user_id);
CREATE INDEX idx_notificaciones_user_id ON public.notificaciones(user_id);
CREATE INDEX idx_notificaciones_leida ON public.notificaciones(leida);

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;