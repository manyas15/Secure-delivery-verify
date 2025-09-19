
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get role from metadata, default to 'customer'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
  
  -- Ensure role is valid
  IF user_role NOT IN ('admin', 'agent', 'customer') THEN
    user_role := 'customer';
  END IF;
  
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role::user_role
  );
  RETURN NEW;
END;
$function$;
