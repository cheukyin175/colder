import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      // Use chrome.storage.local for persistence
      getItem: async (key) => {
        const result = await chrome.storage.local.get(key)
        return result[key] || null
      },
      setItem: async (key, value) => {
        await chrome.storage.local.set({ [key]: value })
      },
      removeItem: async (key) => {
        await chrome.storage.local.remove(key)
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
