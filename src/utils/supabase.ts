import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan ANON KEY dari menu Project Settings > API di Supabase Anda
const supabaseUrl = 'https://ypwhjndborhbptantupw.supabase.co'
const supabaseKey = 'sb_publishable_gDBbD5CpaJMA4SdiyENOIg_iqYNnJdc'

export const supabase = createClient(supabaseUrl, supabaseKey)