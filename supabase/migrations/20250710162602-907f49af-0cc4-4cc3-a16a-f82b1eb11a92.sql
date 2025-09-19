-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'agent', 'customer');

-- Create order status enum  
CREATE TYPE public.order_status AS ENUM ('pending', 'assigned', 'in_transit', 'qr_generated', 'delivered', 'verified');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  agent_id TEXT UNIQUE, -- For delivery agents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  agent_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount DECIMAL(10,2),
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  gps_location JSONB
);

-- Create QR codes table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id),
  qr_data TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create OTP verifications table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery events table for audit trail
CREATE TABLE public.delivery_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for orders
CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Agents can view assigned orders" ON public.orders
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Agents can update assigned orders" ON public.orders
  FOR UPDATE USING (auth.uid() = agent_id);

-- RLS Policies for QR codes
CREATE POLICY "Agents can manage their QR codes" ON public.qr_codes
  FOR ALL USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all QR codes" ON public.qr_codes
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for OTP verifications
CREATE POLICY "Customers can manage their OTPs" ON public.otp_verifications
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Admins can view all OTPs" ON public.otp_verifications
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for delivery events
CREATE POLICY "Users can view events for their orders" ON public.delivery_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = delivery_events.order_id 
      AND (orders.customer_id = auth.uid() OR orders.agent_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all events" ON public.delivery_events
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Insert sample data
INSERT INTO public.orders (order_number, customer_id, customer_name, customer_phone, delivery_address, items, total_amount, status, agent_id) VALUES
('ORD-2024-001', (SELECT id FROM auth.users LIMIT 1), 'Sarah Johnson', '+1234567890', '123 Oak Street, Downtown', '[{"name": "Smartphone", "quantity": 1}, {"name": "Wireless Earbuds", "quantity": 1}]', 899.99, 'in_transit', (SELECT id FROM auth.users LIMIT 1)),
('ORD-2024-002', (SELECT id FROM auth.users LIMIT 1), 'Mike Chen', '+1234567891', '456 Pine Avenue, Eastside', '[{"name": "Laptop", "quantity": 1}, {"name": "Mouse", "quantity": 1}]', 1299.99, 'pending', NULL),
('ORD-2024-003', (SELECT id FROM auth.users LIMIT 1), 'Emma Davis', '+1234567892', '789 Maple Drive, Westend', '[{"name": "Tablet", "quantity": 1}, {"name": "Case", "quantity": 1}]', 599.99, 'verified', (SELECT id FROM auth.users LIMIT 1));