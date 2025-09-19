# 🔍 SMS OTP Debugging Guide

This guide will help you diagnose why you're not receiving SMS OTP messages.

## ✅ Quick Debugging Checklist

### 1. Check Phone Number Format
- **Phone number MUST include country code** (e.g., `+919781098370`)
- **No spaces or special characters** except the `+` prefix
- **Example valid formats:**
  - ✅ `+919781098370` (India)
  - ✅ `+1234567890` (US)
  - ❌ `9781098370` (missing country code)
  - ❌ `+91 9781098370` (has space)

### 2. Environment Variables Check
Go to your Supabase Dashboard and verify these are set:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN` 
- `TWILIO_VERIFY_SERVICE_SID`

### 3. Twilio Account Status
- Check if your Twilio account is active
- Verify you have sufficient balance
- Check if your phone number is verified in Twilio Console

## 🚀 Step-by-Step Debugging Process

### Step 1: View Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on `generate-otp` function
3. Check the logs for debugging output
4. Look for these debug messages:

```
🚀 DEBUGGING - Generate OTP Called
📱 DEBUGGING - Customer Phone Found
🔍 DEBUGGING - Making SMS API Call
📊 DEBUGGING - SMS Result
✅ SMS OTP sent successfully!
```

### Step 2: Check SMS Function Logs
1. Go to `send-sms-otp` function logs
2. Look for these debug messages:

```
🚀 DEBUGGING - SMS OTP Function Called
🔍 DEBUGGING - Environment Variables
📤 SENDING OTP via Twilio Verify
🔍 DEBUGGING - Twilio Credentials Check
🔍 DEBUGGING - Making Twilio API Request
🔍 DEBUGGING - Twilio API Response
✅ SUCCESS - Twilio Verify OTP sent
```

### Step 3: Common Error Messages

#### "Phone number must include country code"
- **Problem**: Phone number format is incorrect
- **Solution**: Ensure phone number starts with `+` and country code

#### "Twilio API Error 400"
- **Problem**: Invalid phone number or service configuration
- **Solution**: Check phone number format and Twilio service settings

#### "Twilio API Error 401"
- **Problem**: Invalid credentials
- **Solution**: Verify Account SID and Auth Token in environment variables

#### "Twilio API Error 404"
- **Problem**: Invalid Verify Service SID
- **Solution**: Check the Verify Service SID in environment variables

#### "Environment Variables: NOT SET"
- **Problem**: Twilio credentials not configured
- **Solution**: Set environment variables in Supabase Dashboard

## 🔧 Manual Testing Steps

### Test 1: Direct Function Call
Use this curl command to test the SMS function directly:

```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/send-sms-otp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "phoneNumber": "+919781098370",
    "action": "send",
    "orderNumber": "TEST-001",
    "customerName": "Test Customer"
  }'
```

### Test 2: Check Database Orders
Verify your order has a valid phone number:

```sql
SELECT 
  id,
  order_number,
  customer_name,
  customer_phone,
  status
FROM orders 
WHERE id = 'your-order-id';
```

### Test 3: Test Phone Number Format
Run this in your browser console to check phone format:

```javascript
const phone = "+919781098370"; // Your phone number
console.log("Valid format:", phone.startsWith('+'));
console.log("Length:", phone.length);
console.log("Digits only after +:", phone.slice(1).match(/^\d+$/));
```

## 📱 Twilio Console Debugging

### Check Verify Service Logs
1. Go to Twilio Console → Verify → Services
2. Click on your service (VAe2b8832d4085e084993119960b955cb6)
3. Go to "Logs" tab
4. Look for recent verification attempts

### Check Account Logs
1. Go to Twilio Console → Monitor → Logs → Verify
2. Look for recent API calls
3. Check success/failure status
4. Review error messages

## 🐛 Common Issues & Solutions

### Issue 1: "Not receiving SMS"
**Debugging Steps:**
1. Check function logs for "✅ SMS OTP sent successfully"
2. Check Twilio Console logs for delivery status
3. Verify phone number is not blocked
4. Check if SMS was delivered to spam/blocked messages

### Issue 2: "Invalid phone number"
**Debugging Steps:**
1. Ensure phone number starts with `+`
2. Check country code is correct
3. Remove any spaces or special characters
4. Test with a different phone number

### Issue 3: "Twilio credentials error"
**Debugging Steps:**
1. Verify all 3 environment variables are set
2. Check credentials are correct in Twilio Console
3. Ensure no extra spaces in environment values
4. Test credentials with Twilio API Explorer

### Issue 4: "Function timeout"
**Debugging Steps:**
1. Check if Twilio API is responding
2. Verify network connectivity
3. Check for any blocking by firewall/proxy

## 📊 Expected Log Output

When everything works correctly, you should see:

```
🚀 DEBUGGING - Generate OTP Called
✅ Authenticated user: user-id-here
✅ Parsed order data: {...}
🔍 DEBUGGING - Looking up order: order-id-here
✅ Order found: ORD-2024-001
📱 Customer phone: +919781098370
📱 DEBUGGING - Customer Phone Found:
- Phone Number: +919781098370
- Phone Format Valid: YES
🔍 DEBUGGING - Making SMS API Call
🔍 DEBUGGING - SMS Function Response:
- Status: 200
📊 DEBUGGING - SMS Result: {success: true, ...}
✅ SMS OTP sent successfully!
💾 Creating database tracking record...
✅ Database tracking record created
✅ SUCCESS - Returning response: {...}
```

## 🆘 If Still Not Working

### Emergency Debugging Mode
Add this to your order table temporarily to debug:

```sql
-- Check if customer phone exists
SELECT customer_phone FROM orders WHERE id = 'your-order-id';

-- Update phone number format if needed
UPDATE orders 
SET customer_phone = '+919781098370' 
WHERE id = 'your-order-id';
```

### Contact Support
If logs show success but no SMS received:
1. Check with your mobile carrier
2. Try a different phone number
3. Check Twilio Console for delivery status
4. Verify Twilio account has sufficient balance

---

**Remember: The debug logs will show you exactly where the process is failing!**
