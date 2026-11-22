import { useRef, useState } from 'react'
import { Cloud, Profile, peekGarden } from '../store'
import { Sheet } from './Panels'

interface Props {
  profiles: Profile[]; activeId: string; onClose: () => void
  onSwitch: (id: string) => void; onCreate: (name: string) => void; onRename: (id: string, name: string) => void; onRemove: (id: string) => void
  onExport: () => { filename: string; text: string }; onImport: (text: string) => { ok: boolean; error?: string }
  cloud: Cloud
}

const when = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

export function GardensSheet({ profiles, activeId, onClose, onSwitch, onCreate, onRename, onRemove, onExport, onImport, cloud }: Props) {
  const [mail, setMail] = useState('')
  const [sent, setSent] = useState(false)
  const [cErr, setCErr] = useState('')
  const [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true); setCErr('')
    try { await cloud.signIn(mail); setSent(true) } catch (e) { setCErr(e instanceof Error ? e.message : 'Could not send the link.') }
    setBusy(false)
  }
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const { filename, text } = onExport()
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMsg({ ok: true, text: `Saved ${filename}. Keep it somewhere safe.` })
  }
  const doImport = async (f?: File) => {
    if (!f) return
    const r = onImport(await f.text())
    setMsg(r.ok ? { ok: true, text: 'Restored as a new garden, and opened.' } : { ok: false, text: r.error || 'Could not restore.' })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Sheet onClose={onClose} narrow label="Your gardens">
      <div className="eyebrow">Your gardens</div>
      <h2>Who is tending?</h2>
      <p className="lede">Each garden keeps its own plants, journal, memories and letters, saved privately on this device (and synced only if you sign in below). Switching never changes the others.</p>

      <div className="gd-list">
        {profiles.map(p => {
          const info = peekGarden(p.id); const on = p.id === activeId
          return (
            <div key={p.id} className={`gd-row ${on ? 'on' : ''}`}>
              <button className="gd-pick" onClick={() => !on && onSwitch(p.id)} aria-pressed={on} aria-label={`Open ${p.name}`}>
                <span className="gd-dot" />
                <span className="gd-info">
                  {editing === p.id ? (
                    <input className="field" autoFocus value={draft} onChange={e => setDraft(e.target.value)} onClick={e => e.stopPropagation()}
                      onKeyDown={e => { if (e.key === 'Enter') { onRename(p.id, draft); setEditing(null) } if (e.key === 'Escape') setEditing(null) }} />
                  ) : <b>{p.name}{on && <em> · here now</em>}</b>}
                  <small>{info ? `${info.plants} plants · ${info.checkins} check-ins · ${info.memories} memories` : 'saved on this device'} · opened {when(p.visited)}</small>
                </span>
              </button>
              <div className="gd-act">
                {editing === p.id
                  ? <button className="btn ghost sm" onClick={() => { onRename(p.id, draft); setEditing(null) }}>Save</button>
                  : <button className="btn ghost sm" onClick={() => { setEditing(p.id); setDraft(p.name) }}>Rename</button>}
                {profiles.length > 1 && (confirm === p.id
                  ? <><button className="btn sm danger" onClick={() => { onRemove(p.id); setConfirm(null) }}>Delete for good</button><button className="btn ghost sm" onClick={() => setConfirm(null)}>Keep it</button></>
                  : <button className="btn ghost sm" onClick={() => setConfirm(p.id)}>Delete</button>)}
              </div>
              {confirm === p.id && <p className="gd-warn">This permanently removes “{p.name}” and everything in it. It cannot be undone. Export a backup first if you might want it back.</p>}
            </div>
          )
        })}
      </div>

      <h3 style={{ marginTop: 20 }}>Start a new garden</h3>
      <div className="row">
        <input className="field" style={{ flex: 1, minWidth: 160 }} placeholder="A name, like “Maya’s garden”" value={name} maxLength={40} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onCreate(name); setName('') } }} />
        <button className="btn" disabled={!name.trim()} onClick={() => { onCreate(name); setName('') }}>Create</button>
      </div>


      {cloud.enabled && (
        <>
          <h3 style={{ marginTop: 20 }}>Sync across devices <span className="hint" style={{ fontWeight: 400 }}>(optional)</span></h3>
          {cloud.email ? (
            <>
              <p className="hint" style={{ margin: '0 0 10px' }}>Signed in as {cloud.email}. Your gardens are copied to your account so they follow you to your other devices.{' '}
                {cloud.status === 'syncing' ? 'Syncing…' : cloud.status === 'ok' && cloud.at ? `Last synced ${new Date(cloud.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.` : ''}</p>
              {cloud.status === 'error' && <p className="hint" role="status" style={{ color: '#a0392b', fontWeight: 600 }}>Could not sync: {cloud.error}. Your gardens are safe on this device.</p>}
              <div className="row">
                <button className="btn ghost" onClick={cloud.syncNow} disabled={cloud.status === 'syncing'}>Sync now</button>
                <button className="btn ghost" onClick={() => { void cloud.signOut() }}>Sign out</button>
              </div>
              <p className="hint" style={{ marginTop: 8 }}>Signing out keeps everything on this device and stops syncing.</p>
            </>
          ) : sent ? (
            <p className="hint" role="status" style={{ color: 'var(--moss-d)', fontWeight: 600 }}>Check your email for a sign-in link, then open it on this device. No password needed.</p>
          ) : (
            <>
              <p className="hint" style={{ margin: '0 0 10px' }}>Gardens stay private on this device unless you choose to sync. Signing in with your email copies them to your account so you can open them on another device. Synced gardens are stored on a cloud database (not end-to-end encrypted). The app works fully without it.</p>
              <div className="row">
                <input className="field" type="email" style={{ flex: 1, minWidth: 160 }} placeholder="you@example.com" value={mail} autoComplete="email" onChange={e => setMail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && mail.includes('@') && !busy) void send() }} />
                <button className="btn" disabled={!mail.includes('@') || busy} onClick={() => void send()}>{busy ? 'Sending…' : 'Email me a link'}</button>
              </div>
              {cErr && <p className="hint" role="status" style={{ marginTop: 8, color: '#a0392b', fontWeight: 600 }}>{cErr}</p>}
            </>
          )}
        </>
      )}

      <h3 style={{ marginTop: 20 }}>Backup and restore</h3>
      <p className="hint" style={{ margin: '0 0 10px' }}>Export saves the garden you are in as a file (photos included). Restore opens a saved file as a new garden, so it never overwrites anything. Use this to move a garden to another browser or device.</p>
      <div className="row">
        <button className="btn ghost" onClick={doExport}>Export this garden</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Restore from file</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => doImport(e.target.files?.[0])} />
      </div>
      {msg && <p className="hint" role="status" style={{ marginTop: 10, color: msg.ok ? 'var(--moss-d)' : '#a0392b', fontWeight: 600 }}>{msg.text}</p>}
      <p className="hint" style={{ marginTop: 14 }}>Clearing this browser’s site data erases gardens that have not been exported.</p>
    </Sheet>
  )
}
