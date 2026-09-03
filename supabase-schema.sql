-- ==============================================================================
-- SCHEMAT BAZY DANYCH DLA SKLEPU Z LIQUIDAMI (SUPABASE POSTGRESQL)
-- ==============================================================================

-- 1. Tabela profili użytkowników (rozszerzenie auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela marek (Elfliq, Vozol, Puffy)
CREATE TABLE IF NOT EXISTS public.brands (
    id TEXT PRIMARY KEY, -- 'elfliq', 'vozol', 'puffy'
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela produktów / smaków liquidów
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    nicotine_strength TEXT DEFAULT '20mg',
    is_available BOOLEAN NOT NULL DEFAULT true,
    price NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela zamówień kupujących
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Oczekujące' CHECK (status IN ('Oczekujące', 'W realizacji', 'Wysłane', 'Do odbioru', 'Zrealizowane', 'Anulowane')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Domyślne marki
INSERT INTO public.brands (id, name, description, image_url)
VALUES 
    ('elfliq', 'Elfliq', 'Oryginalne liquidy od Elfbar. Intensywny, głęboki smak i aksamitna chmurka.', 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=800&auto=format&fit=crop&q=80'),
    ('vozol', 'Vozol', 'Kultowe aromaty serii Vozol. Doskonałe wyważenie słodyczy i orzeźwienia.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80'),
    ('puffy', 'Puffy', 'Nowoczesne, intensywne smaki liquidów z gęstą i aromatyczną parą.', 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Przykładowe smaki na start
INSERT INTO public.products (brand_id, name, description, nicotine_strength, is_available, price, image_url)
VALUES 
    ('elfliq', 'Watermelon', 'Soczysty, orzeźwiający arbuz', '20mg', true, 19.99, ''),
    ('elfliq', 'Blueberry Sour Raspberry', 'Jagoda z kwaśną maliną', '20mg', true, 19.99, ''),
    ('elfliq', 'Apple Peach', 'Połączenie soczystego jabłka i słodkiej brzoskwini', '20mg', false, 19.99, ''),
    ('vozol', 'Strawberry Kiwi', 'Słodka truskawka z kwaskowatym kiwi', '20mg', true, 21.99, ''),
    ('vozol', 'Cool Mint', 'Mocne, lodowe orzeźwienie miętowe', '20mg', true, 21.99, ''),
    ('vozol', 'Lush Ice', 'Mrożony arbuz z nutą mentholu', '20mg', false, 21.99, ''),
    ('puffy', 'Grape Paradise', 'Słodkie, dojrzałe ciemne winogrona', '20mg', true, 18.99, ''),
    ('puffy', 'Mango Ice', 'Egzotyczne mango na lodzie', '20mg', true, 18.99, '')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (public.is_admin());

-- Brands policies
CREATE POLICY "Anyone can view brands" ON public.brands
    FOR SELECT USING (true);

CREATE POLICY "Admins manage brands" ON public.brands
    FOR ALL USING (public.is_admin());

-- Products policies
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admins manage products" ON public.products
    FOR ALL USING (public.is_admin());

-- Orders policies
CREATE POLICY "Customers view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = customer_id OR public.is_admin());

CREATE POLICY "Admins manage orders" ON public.orders
    FOR ALL USING (public.is_admin());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
