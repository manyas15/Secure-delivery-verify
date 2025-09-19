import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Declare Deno global for environment variables
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
    phoneNumber: string;
    action: 'send' | 'verify';
    otpCode?: string; // For verification
    orderNumber?: string;
    customerName?: string;
}

// Twilio Verify API integration
const sendOTPViaTwilioVerify = async (phoneNumber: string) => {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifyServiceSid) {
        throw new Error('Missing required Twilio environment variables. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID');
    }

    console.log('🔍 DEBUGGING - Twilio Credentials Check:');
    console.log('- Account SID:', accountSid ? `${accountSid.substring(0, 10)}...` : 'MISSING');
    console.log('- Auth Token:', authToken ? `${authToken.substring(0, 10)}...` : 'MISSING');
    console.log('- Service SID:', verifyServiceSid ? `${verifyServiceSid.substring(0, 10)}...` : 'MISSING');
    console.log('- Phone Number:', phoneNumber);

    // Verify credentials are properly set
    console.log('🔧 CREDENTIAL VERIFICATION:');
    console.log('- Account SID format valid:', accountSid.startsWith('AC') && accountSid.length === 34);
    console.log('- Auth Token format valid:', authToken.length === 32);
    console.log('- Service SID format valid:', verifyServiceSid.startsWith('VA') && verifyServiceSid.length === 34);

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1234567890)');
    }

    try {
        // Clean and verify credentials
        const cleanAccountSid = accountSid.trim();
        const cleanAuthToken = authToken.trim();
        const cleanServiceSid = verifyServiceSid.trim();
        
        console.log('🧹 CLEANED CREDENTIALS:');
        console.log('- Clean Account SID:', cleanAccountSid);
        console.log('- Clean Auth Token:', cleanAuthToken);
        console.log('- Clean Service SID:', cleanServiceSid);
        console.log('- Account SID length:', cleanAccountSid.length);
        console.log('- Auth Token length:', cleanAuthToken.length);
        console.log('- Service SID length:', cleanServiceSid.length);
        
        const authString = `${cleanAccountSid}:${cleanAuthToken}`;
        console.log('🔐 Auth string before base64:', authString);
        
        const auth = btoa(authString);
        const url = `https://verify.twilio.com/v2/Services/${cleanServiceSid}/Verifications`;

        console.log('🔍 DEBUGGING - Making Twilio API Request:');
        console.log('- URL:', url);
        console.log('- Method: POST');
        console.log('- Headers: Authorization (Basic), Content-Type (form-urlencoded)');
        console.log('- Auth String (before base64):', `${cleanAccountSid}:${cleanAuthToken.substring(0, 10)}...`);
        console.log('- Auth Header (base64):', `Basic ${auth.substring(0, 20)}...`);

        const requestBody = new URLSearchParams({
            To: phoneNumber,
            Channel: 'sms',
        });

        console.log('- Request Body:', requestBody.toString());

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody,
        });

        console.log('🔍 DEBUGGING - Twilio API Response:');
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);
        console.log('- Headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const result = await response.json();
            console.log('✅ SUCCESS - Twilio Verify OTP sent:', result);
            console.log('- SID:', result.sid);
            console.log('- Status:', result.status);
            console.log('- To:', result.to);
            console.log('- Channel:', result.channel);
            console.log('- Valid:', result.valid);

            return { success: true, sid: result.sid, status: result.status, details: result };
        } else {
            const errorText = await response.text();
            console.error('❌ ERROR - Twilio Verify send failed:');
            console.error('- Status:', response.status);
            console.error('- Error Text:', errorText);

            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
                console.error('- Error Details:', errorDetails);
            } catch (parseError) {
                console.error('- Raw Error Text:', errorText);
            }

            throw new Error(`Twilio API Error ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('❌ CRITICAL ERROR - Twilio Verify service error:', error);
        console.error('- Error Type:', error.constructor.name);
        console.error('- Error Message:', error.message);
        console.error('- Error Stack:', error.stack);
        throw error;
    }
};

// Twilio Verify OTP verification
const verifyOTPViaTwilioVerify = async (phoneNumber: string, code: string) => {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    if (!accountSid || !authToken || !verifyServiceSid) {
        throw new Error('Missing required Twilio environment variables. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID');
    }

    console.log('🔍 DEBUGGING - Twilio Verify Check:');
    console.log('- Phone Number:', phoneNumber);
    console.log('- Code:', code ? 'PROVIDED' : 'MISSING');
    console.log('- Code Length:', code ? code.length : 0);

    try {
        const auth = btoa(`${accountSid}:${authToken}`);
        const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;

        console.log('🔍 DEBUGGING - Making Twilio Verify Check Request:');
        console.log('- URL:', url);

        const requestBody = new URLSearchParams({
            To: phoneNumber,
            Code: code,
        });

        console.log('- Request Body:', requestBody.toString());

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: requestBody,
        });

        console.log('🔍 DEBUGGING - Twilio Verify Check Response:');
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Twilio Verify check result:', result);
            console.log('- Status:', result.status);
            console.log('- Valid:', result.valid);
            console.log('- SID:', result.sid);

            return { success: result.status === 'approved', status: result.status, details: result };
        } else {
            const errorText = await response.text();
            console.error('❌ ERROR - Twilio Verify check failed:');
            console.error('- Status:', response.status);
            console.error('- Error Text:', errorText);

            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
                console.error('- Error Details:', errorDetails);
            } catch (parseError) {
                console.error('- Raw Error Text:', errorText);
            }

            throw new Error(`Twilio Verify Check Error ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('❌ CRITICAL ERROR - Twilio Verify check error:', error);
        console.error('- Error Type:', error.constructor.name);
        console.error('- Error Message:', error.message);
        throw error;
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { phoneNumber, action, otpCode, orderNumber, customerName }: SMSRequest = await req.json();

        console.log('🚀 DEBUGGING - SMS OTP Function Called:');
        console.log('- Timestamp:', new Date().toISOString());
        console.log('- Phone Number:', phoneNumber);
        console.log('- Action:', action);
        console.log('- Order Number:', orderNumber);
        console.log('- Customer Name:', customerName);
        console.log('- OTP Code Provided:', otpCode ? 'YES' : 'NO');

        // Environment variables check
        console.log('🔍 DEBUGGING - Environment Variables:');
        console.log('- TWILIO_ACCOUNT_SID:', Deno.env.get('TWILIO_ACCOUNT_SID') ? 'SET' : 'NOT SET');
        console.log('- TWILIO_AUTH_TOKEN:', Deno.env.get('TWILIO_AUTH_TOKEN') ? 'SET' : 'NOT SET');
        console.log('- TWILIO_VERIFY_SERVICE_SID:', Deno.env.get('TWILIO_VERIFY_SERVICE_SID') ? 'SET' : 'NOT SET');

        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }

        // Validate phone number format
        if (!phoneNumber.includes('+')) {
            console.warn('⚠️ WARNING - Phone number may be missing country code:', phoneNumber);
        }

        if (action === 'send') {
            console.log('📤 SENDING OTP via Twilio Verify...');
            const result = await sendOTPViaTwilioVerify(phoneNumber);

            const response = {
                success: true,
                message: 'OTP sent successfully via Twilio Verify',
                phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
                sid: result.sid,
                status: result.status,
                timestamp: new Date().toISOString(),
                debug: {
                    twilioResponse: result.details,
                    action: 'send'
                }
            };

            console.log('✅ SUCCESS - OTP Send Response:', response);

            return new Response(JSON.stringify(response), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } else if (action === 'verify') {
            if (!otpCode) {
                throw new Error('OTP code is required for verification');
            }

            console.log('🔍 VERIFYING OTP via Twilio Verify...');
            const result = await verifyOTPViaTwilioVerify(phoneNumber, otpCode);

            const response = {
                success: result.success,
                message: result.success ? 'OTP verified successfully' : 'OTP verification failed',
                status: result.status,
                phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
                timestamp: new Date().toISOString(),
                debug: {
                    twilioResponse: result.details,
                    action: 'verify'
                }
            };

            console.log(result.success ? '✅ SUCCESS' : '❌ FAILED', '- OTP Verify Response:', response);

            return new Response(JSON.stringify(response), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } else {
            throw new Error('Invalid action. Use "send" or "verify"');
        }

    } catch (error: any) {
        console.error('❌ CRITICAL ERROR in send-sms-otp function:');
        console.error('- Error Type:', error.constructor.name);
        console.error('- Error Message:', error.message);
        console.error('- Error Stack:', error.stack);

        const errorResponse = {
            error: error.message || 'SMS operation failed',
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
