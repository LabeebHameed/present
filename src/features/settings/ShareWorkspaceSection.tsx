import { useState } from 'react'
import { exportWorkspaceTemplate } from '../../lib/workspaceTemplate'
import { secondaryButton } from '../setup/inputStyles'

export function ShareWorkspaceSection({ semesterId, semesterName }: { semesterId: string; semesterName: string }) {
  const [status, setStatus] = useState<string | null>(null)

  const handleCopy = async () => {
    const template = await exportWorkspaceTemplate(semesterId)
    await navigator.clipboard.writeText(JSON.stringify(template))
    setStatus('Copied — paste it wherever you send it to classmates.')
  }

  const handleDownload = async () => {
    const template = await exportWorkspaceTemplate(semesterId)
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${semesterName.replace(/\s+/g, '-').toLowerCase()}-timetable.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">Share this timetable</h2>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Export just the subjects, timetable, and holidays — no attendance records — so classmates can import it
        instead of typing everything in themselves.
      </p>
      <div className="flex gap-2">
        <button type="button" className={secondaryButton} onClick={handleCopy}>
          Copy as text
        </button>
        <button type="button" className={secondaryButton} onClick={handleDownload}>
          Download file
        </button>
      </div>
      {status && <p className="text-xs text-slate-500 dark:text-slate-400">{status}</p>}
    </section>
  )
}
