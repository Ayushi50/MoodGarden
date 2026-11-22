import { useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

/* Optional cloud sync (Supabase free tier). Everything here is inert unless both env vars are set,
   and the supabase library is only downloaded in that case. The app is fully usable signed out. */
const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export const syncEnabled = !!(URL_ && KEY_)

let clientP: Promise<SupabaseClient> | null = null
function client(): Promise<SupabaseClient> {
  if (!syncEnabled) return Promise.reject(new Error('Sync is not configured.'))
  return (clientP ??= import('@supabase/supabase-js').then(m => m.createClient(URL_!, KEY_!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })))
}

export interface RemoteMeta { id: string; updatedAt: number; deleted: boolean }

export async function listMeta(): Promise<RemoteMeta[]> {
  const sb = await client()
  const { data, error } = await sb.from('gardens').select('id,updated_at,deleted')
  if (error) throw error
  return (data || []).map(r => ({ id: r.id as string, updatedAt: Date.parse(r.updated_at as string), deleted: !!r.deleted }))
}
export async function fetchGarden(id: string): Promise<{ name: string; data: unknown }> {
  const sb = await client()
  const { data, error } = await sb.from('gardens').select('name,data').eq('id', id).single()
  if (error) throw error
  return { name: data.name as string, data: data.data }
}
export async function pushGarden(id: string, name: string, data: unknown, at: number) {
  const sb = await client()
  const { error } = await sb.from('gardens').upsert({ id, name, data, deleted: false, updated_at: new Date(at).toISOString() })
  if (error) throw error
}
export async function pushTombstone(id: string, at: number) {
  const sb = await client()
  const { error } = await sb.from('gardens').upsert({ id, name: '', data: null, deleted: true, updated_at: new Date(at).toISOString() })
  if (error) throw error
}

export function useAuth() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(!syncEnabled)

  useEffect(() => {
    if (!syncEnabled) return
    let dead = false; let off = () => {}
    client().then(sb => {
      sb.auth.getSession().then(({ data }) => { if (!dead) { setEmail(data.session?.user.email ?? null); setReady(true) } })
      const { data } = sb.auth.onAuthStateChange((_e, s) => { if (!dead) setEmail(s?.user.email ?? null) })
      off = () => data.subscription.unsubscribe()
    }).catch(() => { if (!dead) setReady(true) })
    return () => { dead = true; off() }
  }, [])

  const signIn = useCallback(async (addr: string) => {
    const sb = await client()
    const { error } = await sb.auth.signInWithOtp({ email: addr.trim(), options: { emailRedirectTo: window.location.origin + window.location.pathname } })
    if (error) throw error
  }, [])
  const signOut = useCallback(async () => { const sb = await client(); await sb.auth.signOut() }, [])

  return { email, ready, signIn, signOut }
}
