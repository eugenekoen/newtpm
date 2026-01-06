/**
 * Supabase Client Configuration
 * Initializes the Supabase client for the application
 */

const SUPABASE_URL = 'https://hjnewoghwyecmgmjsxgn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbmV3b2dod3llY21nbWpzeGduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDU5ODEsImV4cCI6MjA1OTA4MTk4MX0.lzs2Ol0tUWzk0-m-gQHBRPsOjWLBKA0bhImOixFeoUY';

let supabaseClient = null;

try
{
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase client initialized.");
} catch (e)
{
    console.error("Error initializing Supabase client:", e);
}

// Export for use in other modules
window.getSupabaseClient = function ()
{
    return supabaseClient;
};
