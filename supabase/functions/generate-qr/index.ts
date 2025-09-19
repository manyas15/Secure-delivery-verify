import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRRequest {
  orderId: string;
}

serve(async (req) => {
  // Add request logging
  console.log('Generate QR function called:', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization')
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'No Authorization header provided' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Parse request body
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: `Authentication failed: ${authError.message}` }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!user) {
      console.error('No user found in session');
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Get user profile to verify role
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, agent_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    if (!profile || profile.role !== 'agent') {
      throw new Error('Unauthorized: Agent access required');
    }

    console.log('Agent verified:', profile.agent_id);

    // Verify order exists and is assigned to this agent
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('agent_id', user.id)
      .single();

    if (orderError) {
      console.error('Order error:', orderError);
      throw new Error('Order not found or not assigned to you');
    }

    if (!order) {
      throw new Error('Order not found');
    }

    console.log('Order found:', order.order_number);

    // Generate secure QR data
    const qrData = {
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      items: order.items,
      timestamp: new Date().toISOString(),
      agentId: user.id,
    };

    const qrDataString = JSON.stringify(qrData);

    // Store QR code in database with 5-minute expiry (optional - skip if table doesn't exist)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    let qrRecordId: string | null = null;
    try {
      const { data: insertedRecord, error: qrError } = await supabaseClient
        .from('qr_codes')
        .insert({
          order_id: orderId,
          agent_id: user.id,
          qr_data: qrDataString,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (qrError) {
        console.error('QR insertion error:', qrError);
        // Continue without storing QR record
      } else {
        qrRecordId = insertedRecord?.id || null;
        console.log('QR code stored:', qrRecordId);
      }
    } catch (tableError) {
      console.warn('QR codes table might not exist, skipping storage:', tableError);
    }

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ status: 'qr_generated' })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order update error:', updateError);
      // Don't throw here as QR is already generated
    }

    // Log event
    const { error: eventError } = await supabaseClient
      .from('delivery_events')
      .insert({
        order_id: orderId,
        event_type: 'qr_generated',
        description: 'QR code generated for order verification',
        user_id: user.id,
        metadata: qrRecordId ? { qr_id: qrRecordId } : {}
      });

    if (eventError) {
      console.error('Event logging error:', eventError);
      // Don't throw here as QR is already generated
    }

    return new Response(JSON.stringify({
      success: true,
      qrData: qrDataString,
      qrId: qrRecordId,
      expiresAt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-qr function:', error);
    
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    
    if (error.message) {
      errorMessage = error.message;
      
      // Set appropriate status codes
      if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
        statusCode = 401;
      } else if (error.message.includes('not found') || error.message.includes('not assigned')) {
        statusCode = 404;
      } else if (error.message.includes('required')) {
        statusCode = 400;
      }
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.details || null
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});