import { useRef, useState } from 'react'
import { exportBackup, importBackup } from '../../lib/backup'
import { secondaryButton } from '../setup/inputStyles'

export function BackupSection() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleExport = async () => {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `classtrack-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!window.confirm('Importing replaces all data currently on this device. Continue?')) return
    try {
      await importBackup(file)
      setStatus('Import complete.')
    } catch {
      setStatus('Import failed — the file may be corrupted or from an unsupported version.')
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Backup</h2>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        All data stays on this device. Export a backup file to keep a copy, or import one to restore it.
      </p>
      <div className="flex gap-2">
        <button type="button" className={secondaryButton} onClick={handleExport}>
          Export backup
        </button>
        <button type="button" className={secondaryButton} onClick={handleImportClick}>
          Import backup
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileSelected} />
      </div>
      {status && <p className="text-xs text-slate-500 dark:text-slate-400">{status}</p>}
    </section>
  )
}
