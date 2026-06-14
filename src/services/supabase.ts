import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = 'https://umykwmfzssjzehjfdctj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVteWt3bWZ6c3NqemVoamZkY3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjM2NjEsImV4cCI6MjA5NTQ5OTY2MX0.sDIqedFP80vir2afactcpvuGItlY47BeZlvqPTO55MM'

const authOptions = Platform.OS === 'web'
  ? {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    }
  : {
      auth: {
        storage: require('@react-native-async-storage/async-storage').default,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      }
    }

export const supabase = createClient(supabaseUrl, supabaseKey, authOptions)