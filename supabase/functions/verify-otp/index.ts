import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno global for environment variables
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  orderId: string;
  otpCode: string;
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

    const { orderId, otpCode }: OTPRequest = await req.json();

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get order details to find customer phone number
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Verify OTP using Twilio Verify
    if (order.customer_phone) {
      try {
        const verifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
            'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          },
          body: JSON.stringify({
            phoneNumber: order.customer_phone,
            action: 'verify',
            otpCode: otpCode
          }),
        });

        console.log('🔍 DEBUGGING - Verify API Response:');
        console.log('- Status:', verifyResponse.status);
        console.log('- Status Text:', verifyResponse.statusText);
        console.log('- Headers:', Object.fromEntries(verifyResponse.headers.entries()));

        const verifyResult = await verifyResponse.json();
        console.log('📊 DEBUGGING - Verify Result:', verifyResult);

        if (!verifyResponse.ok || !verifyResult.success) {
          console.error('❌ ERROR - Twilio Verify failed:', verifyResult);
          console.error('- Response Status:', verifyResponse.status);
          console.error('- Verify Success:', verifyResult.success);
          console.error('- Error Message:', verifyResult.error);
          console.error('- Verify Status:', verifyResult.status);
          throw new Error(verifyResult.error || 'OTP verification failed');
        }

        console.log('✅ OTP verification successful!');

        // Update our database record - use upsert to handle cases where record doesn't exist
        try {
          console.log('💾 Upserting database OTP record...');
          console.log('- Order Customer ID:', order.customer_id);
          console.log('- Current User ID:', user.id);
          
          // First try to find existing record using order's customer_id
          const { data: existingRecord, error: findError } = await supabaseClient
            .from('otp_verifications')
            .select('*')
            .eq('order_id', orderId)
            .eq('customer_id', order.customer_id) // Use customer ID from order
            .single();

          console.log('🔍 Existing OTP record check:', { existingRecord, findError });

          if (existingRecord) {
            // Update existing record
            const { error: updateOtpError } = await supabaseClient
              .from('otp_verifications')
              .update({ 
                is_verified: true, 
                verified_at: new Date().toISOString() 
              })
              .eq('id', existingRecord.id);

            if (updateOtpError) {
              console.error('⚠️ Error updating existing OTP record:', updateOtpError);
            } else {
              console.log('✅ Existing OTP record updated successfully');
            }
          } else {
            // Create new record using order's customer_id
            const { error: insertOtpError } = await supabaseClient
              .from('otp_verifications')
              .insert({
                order_id: orderId,
                customer_id: order.customer_id, // Use customer ID from order
                otp_code: otpCode,
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
                is_verified: true,
                verified_at: new Date().toISOString(),
                attempts: 1
              });

            if (insertOtpError) {
              console.error('⚠️ Error inserting new OTP record:', insertOtpError);
            } else {
              console.log('✅ New OTP record created successfully');
            }
          }
        } catch (dbError) {
          console.error('⚠️ Database operation failed:', dbError);
          // Continue anyway as Twilio Verify succeeded
        }

        // Update order status - keep as qr_generated, don't auto-mark as delivered
        // Agent must manually mark as delivered after customer verification
        console.log('💾 Order verified by customer - keeping status as qr_generated...');
        console.log('📋 Agent can now mark the delivery as completed in dashboard');
        
        // Don't update order status here - let the agent mark as delivered manually
        // This ensures proper verification flow and prevents premature completion
        console.log('🎉 OTP verification completed successfully');

        const successResponse = {
          success: true,
          message: 'Order delivery verified successfully',
          twilioVerify: true,
          verificationStatus: verifyResult.status,
          debug: {
            phoneNumber: order.customer_phone.replace(/\d(?=\d{4})/g, '*'),
            twilioResult: verifyResult
          }
        };

        console.log('✅ SUCCESS - Returning response:', successResponse);

        return new Response(JSON.stringify(successResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (twilioError) {
        console.error('❌ CRITICAL ERROR - Twilio Verify error:', twilioError);
        console.error('- Error Type:', twilioError.constructor.name);
        console.error('- Error Message:', twilioError.message);
        console.error('- Error Stack:', twilioError.stack);
        throw new Error(`Verification failed: ${twilioError.message}`);
      }
    } else {
      console.error('❌ No customer phone number found for verification');
      throw new Error('No customer phone number found for verification');
    }

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in verify-otp function:');
    console.error('- Error Type:', error.constructor.name);
    console.error('- Error Message:', error.message);
    console.error('- Error Stack:', error.stack);
    
    const errorResponse = { 
      error: error.message || 'Verification failed',
      details: error.toString(),
      timestamp: new Date().toISOString(),
      debug: {
        errorType: error.constructor.name,
        stack: error.stack
      }
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
