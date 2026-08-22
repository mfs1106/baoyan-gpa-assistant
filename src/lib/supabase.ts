import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * 仅使用可公开的 publishable / anon key。数据库是否允许访问由 RLS 决定；
 * service_role 密钥绝不能出现在浏览器代码或 .env 中。
 */
export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const hasSupabaseConfig = Boolean(supabase);
export const USER_FILES_BUCKET = 'user-files';
