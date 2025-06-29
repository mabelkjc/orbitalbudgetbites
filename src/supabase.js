import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqbtjhmdqlrhhxgbvroz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxYnRqaG1kcWxyaGh4Z2J2cm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjE0MjgsImV4cCI6MjA2NjU5NzQyOH0.H817RX3xi2B8bVwa8jK5xC-TTcjrzCheVxnyoCt0Az0';

export const createSupabaseWithAuth = (token) => 
    createClient(supabaseUrl, supabaseKey, {
        global: {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        },
    });