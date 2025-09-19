import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno global for environment variables
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  items: any[];
  timestamp: string;
  agentId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { qrData } = await req.json();
    
    console.log('🔍 DEBUGGING - Received request:');
    console.log('- QR Data:', qrData);
    console.log('- QR Data Type:', typeof qrData);

    // Parse QR data first to validate it
    let orderData: QRData;
    try {
      console.log('🔍 Attempting to parse QR data...');
      orderData = JSON.parse(qrData);
      console.log('✅ Parsed QR data:', orderData);
    } catch (parseError) {
      console.error('❌ QR parsing failed:', parseError);
      console.error('- Raw QR Data:', qrData);
      throw new Error('Invalid QR code format');
    }

    const { orderId, orderNumber, customerName, items } = orderData;

    if (!orderId || !orderNumber) {
      throw new Error('Missing required order information in QR code');
    }

    // Get user from auth (optional for QR scanning - customers don't need to be logged in)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError) {
      console.log('⚠️ No user authentication (this is OK for customer QR scanning)');
    } else {
      console.log('✅ User authenticated:', user.id);
    }

    // Verify that the order exists and get customer phone number
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found or access denied');
    }

    // Send OTP via Twilio Verify instead of generating locally
    if (order.customer_phone) {
      try {
        const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          },
          body: JSON.stringify({
            phoneNumber: order.customer_phone,
            action: 'send',
            orderNumber: order.order_number,
            customerName: order.customer_name
          }),
        });

        console.log('🔍 DEBUGGING - SMS Function Response:');
        console.log('- Status:', smsResponse.status);
        console.log('- Status Text:', smsResponse.statusText);
        console.log('- Headers:', Object.fromEntries(smsResponse.headers.entries()));

        const smsResult = await smsResponse.json();
        console.log('📊 DEBUGGING - SMS Result:', smsResult);

        if (!smsResponse.ok || !smsResult.success) {
          console.error('❌ ERROR - Twilio Verify failed:', smsResult);
          throw new Error(smsResult.error || 'Failed to send OTP via SMS');
        }

        console.log('✅ SMS OTP sent successfully!');

        // Create a tracking record in our database (optional)
        try {
          console.log('💾 Creating database tracking record...');
          console.log('- Order Customer ID:', order.customer_id);
          console.log('- Current User ID:', user.id);
          
          const { data: otpRecord, error: otpCreateError } = await supabaseClient
            .from('otp_verifications')
            .insert({
              order_id: orderId,
              customer_id: order.customer_id, // Use customer ID from order, not current user
              otp_code: 'TWILIO_VERIFY', // Placeholder since Twilio manages the actual code
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              is_verified: false,
              attempts: 0,
              twilio_sid: smsResult.sid
            })
            .select()
            .single();

          if (otpCreateError) {
            console.error('⚠️ Database OTP tracking failed:', otpCreateError);
            // Continue anyway as Twilio Verify is handling the OTP
          } else {
            console.log('✅ Database tracking record created:', otpRecord);
          }
        } catch (dbError) {
          console.error('⚠️ Database operation failed:', dbError);
          // Continue anyway as Twilio Verify is handling the OTP
        }

        // Return success response
        const successResponse = {
          success: true,
          otpCode: 'SENT_VIA_SMS', // Don't expose the actual OTP
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          orderDetails: {
            orderId: orderId,
            orderNumber: order.order_number,
            customerName: order.customer_name,
            deliveryAddress: order.delivery_address,
            items: order.items
          },
          smsNotification: `OTP sent via SMS to ${order.customer_phone.replace(/\d(?=\d{4})/g, '*')}`,
          twilioVerify: true,
          sid: smsResult.sid,
          debug: {
            phoneNumber: order.customer_phone,
            twilioResult: smsResult
          }
        };

        console.log('✅ SUCCESS - Returning response:', successResponse);

        return new Response(JSON.stringify(successResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (smsError) {
        console.error('❌ CRITICAL ERROR - Twilio Verify error:', smsError);
        console.error('- Error Type:', smsError.constructor.name);
        console.error('- Error Message:', smsError.message);
        console.error('- Error Stack:', smsError.stack);
        throw new Error(`Failed to send OTP: ${smsError.message}`);
      }
    } else {
      console.error('❌ No customer phone number found for this order');
      throw new Error('No customer phone number found for this order');
    }

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in generate-otp function:');
    console.error('- Error Type:', error.constructor?.name || 'Unknown');
    console.error('- Error Message:', error.message || 'No message');
    console.error('- Error String:', error.toString());
    
    // Check if it's a Twilio-specific error
    if (error.message && error.message.includes('Twilio API Error')) {
      console.error('🔧 TWILIO ERROR DETECTED:');
      console.error('- This is likely a Twilio authentication or configuration issue');
      console.error('- Check Twilio credentials and verify service SID');
    }
    
    // Check if it's an order not found error
    if (error.message && error.message.includes('Order not found')) {
      console.error('📦 ORDER ERROR DETECTED:');
      console.error('- The order ID from the QR code does not exist in the database');
      console.error('- Make sure you are scanning a QR code from a real order');
    }
    
    const errorResponse = { 
      error: error.message || 'OTP generation failed',
      details: error.toString(),
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.constructor?.name || 'Unknown',
        isTwilioError: error.message?.includes('Twilio') || false,
        isOrderError: error.message?.includes('Order') || false,
        rawError: error
      }
    };
    
    console.error('📄 Returning error response:', errorResponse);
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
