import { createClient } from '@supabase/supabase-js'

// Supabase credentials из переменных окружения
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://taoeikfqvyedgianjtmo.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhb2Vpa2ZxdnllZGdpYW5qdG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5NDk4ODQsImV4cCI6MjA3OTUyNTg4NH0.j09mEv2Zj45tZQ-grouiD42DzhgfG0M30IE0JNINT6M'

// Используем anon key (для production лучше использовать service_role key)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

