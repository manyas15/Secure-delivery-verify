// Quick script to clear OTP verification records for testing security
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://apninbhrxrprrbcqgdeo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmluYmhyeHJwcnJiY3FnZGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjQxMTksImV4cCI6MjA2Nzc0MDExOX0.jLtXQobNMoHpVE8NA7YI5xirX9QZFANn5IEXhHEQpAw'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function clearOTPRecords() {
  console.log('🔄 Clearing OTP verification records for security testing...')
  
  // Get all OTP verification records
  const { data: records, error: fetchError } = await supabase
    .from('otp_verifications')
    .select('*')
  
  if (fetchError) {
    console.error('❌ Failed to fetch OTP records:', fetchError)
    return
  }
  
  console.log('📊 Found OTP records:', records?.length || 0)
  
  if (records && records.length > 0) {
    // Delete all OTP verification records
    const { error: deleteError } = await supabase
      .from('otp_verifications')
      .delete()
      .neq('id', 'never-match') // Delete all records
    
    if (deleteError) {
      console.error('❌ Failed to delete OTP records:', deleteError)
      return
    }
    
    console.log('✅ Successfully cleared all OTP verification records')
    console.log('🔒 Orders are now unverified - agents should NOT be able to mark as delivered')
  } else {
    console.log('ℹ️ No OTP records found to clear')
  }
}

clearOTPRecords().catch(console.error)