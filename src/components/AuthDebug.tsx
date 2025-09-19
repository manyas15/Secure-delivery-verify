import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AuthDebug = () => {
  const { profile } = useAuth();
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setAuthInfo({
        session: session ? {
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
          user_id: session.user?.id,
          expires_at: session.expires_at,
        } : null,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
        } : null,
        profile: profile,
        sessionError,
        userError,
      });
    } catch (error) {
      setAuthInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testQRGeneration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: { orderId: 'test-order-id' },
      });
      
      setAuthInfo(prev => ({
        ...prev,
        qrTest: { data, error }
      }));
    } catch (error) {
      setAuthInfo(prev => ({
        ...prev,
        qrTest: { error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkAuth} disabled={loading}>
            Check Auth Status
          </Button>
          <Button onClick={testQRGeneration} disabled={loading}>
            Test QR Generation
          </Button>
        </div>
        
        {authInfo && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(authInfo, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDebug;