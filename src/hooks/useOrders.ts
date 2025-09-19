import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  agent_id?: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  items: any;
  total_amount?: number | null;
  status: 'pending' | 'assigned' | 'in_transit' | 'qr_generated' | 'delivered' | 'verified';
  created_at: string;
  updated_at: string;
  delivered_at?: string | null;
  gps_location?: any;
  // Agent details
  agent_full_name?: string;
  agent_name?: string;
  agent_code?: string;
  vehicle_number?: string;
  vehicle_type?: string;
  license_number?: string;
  agent_contact?: string;
  agent_phone?: string;
}

export const useOrders = (userId?: string, userRole?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!userId || !userRole) return;

    let query = supabase.from('orders').select('*');

    if (userRole === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (userRole === 'agent') {
      query = query.eq('agent_id', userId);
    }

    query = query.order('created_at', { ascending: false });

    const { data: ordersData, error: ordersError } = await query;

    if (ordersError) {
      return;
    }

    // Fetch agent profiles for orders that have agents
    const ordersWithAgents = await Promise.all(
      (ordersData || []).map(async (order: any) => {
        if (!order.agent_id) {
          return order; // No agent assigned
        }

        // Fetch agent profile (using existing columns only for now)
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('full_name, agent_id, phone')
          .eq('user_id', order.agent_id)
          .single();

        if (agentError || !agentData) {
          return order; // Return order without agent details if fetch fails
        }

        // Combine order with agent details (using existing + placeholder data)
        return {
          ...order,
          agent_full_name: agentData.full_name,
          agent_name: agentData.agent_id ? `Agent ${agentData.agent_id}` : null,
          agent_code: agentData.agent_id,
          vehicle_number: 'VH-001', // Placeholder
          vehicle_type: 'Motorcycle', // Placeholder
          license_number: 'DL-12345678', // Placeholder
          agent_contact: agentData.phone,
          agent_phone: agentData.phone,
        };
      })
    );

    setOrders(ordersWithAgents);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, userRole]);

  const generateQR = async (orderId: string) => {
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('User not authenticated - no session found');
      }

      if (!session.access_token) {
        throw new Error('User not authenticated - no access token');
      }

      // First, let's verify the order exists and user has access to it
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('agent_id', session.user.id)
        .single();

      if (orderError) {
        console.error('Order verification error:', orderError);
        throw new Error('Order not found or not assigned to you');
      }

      if (!order) {
        throw new Error('Order not found');
      }

      // Generate QR data directly instead of using edge function
      const qrData = JSON.stringify({
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        items: order.items || [],
        timestamp: new Date().toISOString(),
        agentId: session.user.id
      });

      // Update order status to indicate QR was generated
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'qr_generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update order status');
      }

      return {
        qrData,
        orderDetails: {
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone,
          deliveryAddress: order.delivery_address,
        }
      };
    } catch (error: any) {
      // Add more context to the error
      console.error('generateQR error:', error);
      throw error;
    }
  };

  const generateOTP = async (qrData: string) => {
    try {
      // Try to get current session for auth token, but don't require it for QR scanning
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmluYmhyeHJwcnJiY3FnZGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjQxMTksImV4cCI6MjA2Nzc0MDExOX0.jLtXQobNMoHpVE8NA7YI5xirX9QZFANn5IEXhHEQpAw',
      };
      
      // Add authorization header - use session token if available, otherwise use anon key
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // For unauthenticated requests (customer QR scanning), use anon key
        headers['Authorization'] = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmluYmhyeHJwcnJiY3FnZGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjQxMTksImV4cCI6MjA2Nzc0MDExOX0.jLtXQobNMoHpVE8NA7YI5xirX9QZFANn5IEXhHEQpAw`;
      }

      const response = await fetch('https://apninbhrxrprrbcqgdeo.supabase.co/functions/v1/generate-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ qrData }),
      });

      const responseText = await response.text();
      
      console.log('🔍 DEBUGGING - generate-otp response:');
      console.log('- Status:', response.status);
      console.log('- Status Text:', response.statusText);
      console.log('- Response Text:', responseText);

      if (response.ok) {
        const data = JSON.parse(responseText);
        
        if (!data.error) {
          return data;
        }
      }
      
      let errorMessage = 'Unknown error occurred';
      try {
        const errorJson = JSON.parse(responseText);
        console.log('🔍 Parsed error response:', errorJson);
        errorMessage = errorJson.error || errorJson.message || responseText;
      } catch {
        errorMessage = responseText || `HTTP ${response.status} error`;
      }
      throw new Error(errorMessage);
        
    } catch (error: any) {
      throw error;
    }
  };

  const verifyOTP = async (orderId: string, otpCode: string) => {
    try {
      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        throw new Error('No authentication session found');
      }

      const response = await fetch('https://apninbhrxrprrbcqgdeo.supabase.co/functions/v1/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmluYmhyeHJwcnJiY3FnZGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjQxMTksImV4cCI6MjA2Nzc0MDExOX0.jLtXQobNMoHpVE8NA7YI5xirX9QZFANn5IEXhHEQpAw',
        },
        body: JSON.stringify({ orderId, otpCode }),
      });

      const responseText = await response.text();

      if (response.ok) {
        const data = JSON.parse(responseText);
        
        if (!data.error) {
          return data;
        }
      }
      
      // If we get here, the Edge Function returned an error
      let errorMessage = 'Unknown error occurred';
      try {
        const errorJson = JSON.parse(responseText);
        errorMessage = errorJson.error || errorJson.message || responseText;
      } catch {
        errorMessage = responseText || `HTTP ${response.status} error`;
      }
      throw new Error(errorMessage);
        
    } catch (error: any) {
      throw error;
    }
  };

  const fetchOrderWithAgent = async (orderId: string): Promise<Order | null> => {
    try {
      // First get the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        return null;
      }

      let agentProfile = null;
      if (orderData.agent_id) {
        const { data: agentData, error: agentError } = await supabase
          .from('profiles')
          .select('full_name, agent_id, phone')
          .eq('user_id', orderData.agent_id)
          .single();

        if (!agentError && agentData) {
          agentProfile = agentData;
        }
      }

      return {
        ...orderData,
        agent_full_name: agentProfile?.full_name || null,
        agent_name: agentProfile?.agent_id ? `Agent ${agentProfile.agent_id}` : null,
        agent_code: agentProfile?.agent_id || null,
        vehicle_number: 'VH-001', // Placeholder until DB is updated
        vehicle_type: 'Motorcycle', // Placeholder until DB is updated
        license_number: 'DL-12345678', // Placeholder until DB is updated
        agent_contact: agentProfile?.phone || null,
        agent_phone: agentProfile?.phone || null,
      };
    } catch (error) {
      return null;
    }
  };

  return {
    orders,
    loading,
    generateQR,
    generateOTP,
    verifyOTP,
    refetch: fetchOrders,
    fetchOrderWithAgent,
  };
};