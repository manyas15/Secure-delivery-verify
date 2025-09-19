import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno global for environment variables
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Test Twilio Verify Service
const testTwilioVerifyService = async () => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Missing required Twilio environment variables. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID');
  }

  console.log('🔍 TESTING - Twilio Setup:');
  console.log('- Account SID:', accountSid);
  console.log('- Auth Token (first 10 chars):', authToken.substring(0, 10) + '...');
  console.log('- Service SID:', verifyServiceSid);
  console.log('- Environment variables available:');
  console.log('  - TWILIO_ACCOUNT_SID exists:', !!Deno.env.get('TWILIO_ACCOUNT_SID'));
  console.log('  - TWILIO_AUTH_TOKEN exists:', !!Deno.env.get('TWILIO_AUTH_TOKEN'));
  console.log('  - TWILIO_VERIFY_SERVICE_SID exists:', !!Deno.env.get('TWILIO_VERIFY_SERVICE_SID'));

  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Test 1: List all Verify Services
    console.log('\n📋 TEST 1: List all Verify Services');
    const listResponse = await fetch('https://verify.twilio.com/v2/Services', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    console.log('- List Services Response Status:', listResponse.status);
    
    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ Your Verify Services:', listResult);
      
      if (listResult.services && listResult.services.length > 0) {
        console.log('\n📋 Available Services:');
        listResult.services.forEach((service: any) => {
          console.log(`- SID: ${service.sid}, Name: ${service.friendly_name}`);
        });
      } else {
        console.log('⚠️ No Verify Services found in your account');
      }
    } else {
      const error = await listResponse.text();
      console.error('❌ Failed to list services:', error);
      return { success: false, error: 'Failed to list services', details: error };
    }

    // Test 2: Check specific service
    console.log('\n🔍 TEST 2: Check specific service');
    const serviceResponse = await fetch(`https://verify.twilio.com/v2/Services/${verifyServiceSid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    console.log('- Service Check Response Status:', serviceResponse.status);
    
    if (serviceResponse.ok) {
      const serviceResult = await serviceResponse.json();
      console.log('✅ Service found:', serviceResult);
      return { 
        success: true, 
        message: 'Service exists and is accessible',
        service: serviceResult
      };
    } else {
      const error = await serviceResponse.text();
      console.error('❌ Service not found:', error);
      
      // Test 3: Create new service if current one doesn't exist
      console.log('\n🔧 TEST 3: Creating new Verify Service');
      const createResponse = await fetch('https://verify.twilio.com/v2/Services', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: 'SecureDelivery OTP Service',
          CodeLength: '6',
        }),
      });

      console.log('- Create Service Response Status:', createResponse.status);
      
      if (createResponse.ok) {
        const createResult = await createResponse.json();
        console.log('✅ New service created:', createResult);
        return { 
          success: true, 
          message: 'New service created successfully',
          newService: createResult,
          newServiceSid: createResult.sid
        };
      } else {
        const createError = await createResponse.text();
        console.error('❌ Failed to create service:', createError);
        return { 
          success: false, 
          error: 'Failed to create new service', 
          details: createError 
        };
      }
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    return { 
      success: false, 
      error: 'Network or authentication error', 
      details: (error as Error).message 
    };
  }
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 TESTING Twilio Verify Service Setup');
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));
    
    const result = await testTwilioVerifyService();
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Test function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Test failed',
      details: error.toString(),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
