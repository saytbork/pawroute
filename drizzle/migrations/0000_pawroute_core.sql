CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE UNIQUE INDEX user_roles_single_admin ON public.user_roles (role) WHERE role = 'admin';
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Atomic first-owner claim: only succeeds when no owner exists yet.
CREATE OR REPLACE FUNCTION public.claim_first_owner()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('pawroute_owner_claim'));
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin' AND user_id = auth.uid());
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_first_owner() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_owner() TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_seat_taken()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.owner_seat_taken() TO authenticated, anon;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manage_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','pending_review','callback_requested','cancelled','declined')),
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text,
  contact_consent boolean NOT NULL DEFAULT false,
  dog_name text NOT NULL,
  breed text,
  weight_lb integer,
  service text NOT NULL,
  behavior_notes text,
  original_message text,
  address text,
  postal_code text,
  lat double precision,
  lng double precision,
  preferred_window text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  block_end timestamptz,
  duration_min integer NOT NULL DEFAULT 60,
  buffer_min integer NOT NULL DEFAULT 20,
  estimated_price numeric(8,2),
  deposit_required numeric(8,2),
  route_status text NOT NULL DEFAULT 'unavailable' CHECK (route_status IN ('optimized','unavailable','not_applicable')),
  route_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  needs_review boolean NOT NULL DEFAULT false,
  review_reasons text[] NOT NULL DEFAULT '{}',
  review_resolved_at timestamptz,
  review_decision text,
  reschedule_count integer NOT NULL DEFAULT 0,
  confirmation_email_status text NOT NULL DEFAULT 'not_attempted',
  reminder_status text,
  reminder_sent_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    tstzrange(scheduled_start, block_end, '[)') WITH &&
  ) WHERE (status IN ('confirmed','pending_review') AND scheduled_start IS NOT NULL AND block_end IS NOT NULL)
);
CREATE INDEX bookings_start_idx ON public.bookings (scheduled_start);
GRANT SELECT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner updates bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  kind text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_events_created_idx ON public.booking_events (created_at DESC);
GRANT SELECT ON public.booking_events TO authenticated;
GRANT ALL ON public.booking_events TO service_role;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads events" ON public.booking_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.geocode_cache (
  query text PRIMARY KEY,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.geocode_cache TO service_role;
ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;