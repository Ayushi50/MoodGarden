import { useCallback, useEffect, useState } from 'react'
import type { createClient } from '@neon/neon-js/supabase'

/* Optional Neon Auth and Data API sync; without a project URL the app stays local-only. */
const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
const DATA_API_URL = import.meta.env.VITE_NEON_DATA_API_URL as string | undefined
export const syncEnabled = !!(AUTH_URL && DATA_API_URL)

interface GardenRow {
  id: string
  name: string
  data: unknown
  deleted: boolean
  updated_at: string
}
interface Database {
  public: {
    Tables: {
      gardens: {
        Row: GardenRow
        Insert: Partial<GardenRow>
        Update: Partial<GardenRow>
        Relationships: []
      }
    }
  }
}

type NeonClient = ReturnType<typeof createClient<Database>>
let clientP: Promise<NeonClient> | null = null
function client(): Promise<NeonClient> {
  if (!syncEnabled) return Promise.reject(new Error('Sync is not configured.'))
  return (clientP ??= import('@neon/neon-js/supabase').then(m => m.createClient<Database>({
    auth: { url: AUTH_URL! },
    dataApi: { url: DATA_API_URL! },
  })))
}

export interface RemoteMeta { id: string; updatedAt: number; deleted: boolean }

export async function listMeta(): Promise<RemoteMeta[]> {
  const sb = await client()
  const { data, error } = await sb.from('gardens').select('id,updated_at,deleted')
  if (error) throw error
  return (data || []).map((r: { id: string; updated_at: string; deleted: boolean }) => ({
    id: r.id,
    updatedAt: Date.parse(r.updated_at),
    deleted: !!r.deleted,
  }))
}
export async function fetchGarden(id: string): Promise<{ name: string; data: unknown }> {
  const sb = await client()
  const { data, error } = await sb.from('gardens').select('name,data').eq('id', id).single()
  if (error) throw error
  return { name: (data as unknown as GardenRow).name, data: (data as unknown as GardenRow).data }
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
  const [authError, setAuthError] = useState<string>()

  useEffect(() => {
    if (!syncEnabled) return
    let dead = false; let off = () => {}
    client().then(async sb => {
      const { data, error } = await sb.auth.getSession()
      if (error) throw error
      if (!dead) { setEmail(data.session?.user.email ?? null); setReady(true) }
      const { data: subscription } = sb.auth.onAuthStateChange((_event: unknown, session: { user: { email?: string } } | null) => {
        if (!dead) {
          setEmail(session?.user.email ?? null)
          setAuthError(undefined)
        }
      })
      off = () => subscription.subscription.unsubscribe()
    }).catch(e => {
      if (!dead) {
        setAuthError(e instanceof Error ? e.message : 'Could not connect to sign-in.')
        setReady(true)
      }
    })
    return () => { dead = true; off() }
  }, [])

  const signIn = useCallback(async (addr: string) => {
    const sb = await client()
    const { error } = await sb.auth.signInWithOtp({ email: addr.trim() })
    if (error) throw error
  }, [])
  const verifyOtp = useCallback(async (addr: string, otp: string) => {
    const sb = await client()
    const { error } = await sb.auth.verifyOtp({ email: addr.trim(), token: otp.trim(), type: 'email' })
    if (error) throw error
    const { data, error: sessionError } = await sb.auth.getSession()
    if (sessionError) throw sessionError
    const verifiedEmail = data.session?.user.email
    if (!verifiedEmail) throw new Error('The code was accepted, but no signed-in session was created. Please try again.')
    setEmail(verifiedEmail)
  }, [])
  const signOut = useCallback(async () => {
    const sb = await client()
    const { error } = await sb.auth.signOut()
    if (error) throw error
    setEmail(null)
  }, [])

  return { email, ready, authError, signIn, verifyOtp, signOut }
}
