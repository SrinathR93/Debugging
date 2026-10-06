import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gzmjyjzcibqstdaoekms.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NOEqQyPvlz6nIf1Rf5C8ww_4_UQbpDO';

export const supabase = createClient(supabaseUrl, supabaseKey);
