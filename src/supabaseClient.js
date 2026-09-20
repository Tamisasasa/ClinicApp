import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wzmzyuttbggvngvmnuvk.supabase.co';
const supabaseAnonKey = 'sb_publishable_4JfmZuXINfoCDBaenS8s_Q_R1UTjFte';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);