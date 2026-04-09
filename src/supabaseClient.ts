/**
 * Supabase 클라이언트 설정
 * - 모든 환경(PC, 모바일, 다른 브라우저)에서 동일한 데이터를 보여주기 위해
 *   Supabase 클라우드 DB를 사용합니다.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://etasxbaorwgjoofdxean.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0YXN4YmFvcndnam9vZmR4ZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzUwMDIsImV4cCI6MjA5MTI1MTAwMn0.x8gV5pPEflhTniecyVrBNvjedkuimVRBUjh3zvez_us'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
