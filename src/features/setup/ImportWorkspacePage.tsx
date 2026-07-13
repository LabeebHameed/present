import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parseWorkspaceTemplate, workspaceTemplateToWizardState } from '../../lib/workspaceTemplate'
import { fieldInput, primaryButton, secondaryButton } from './inputStyles'

export function ImportWorkspacePage() {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleImport = () => {
    try {
      const template = parseWorkspaceTemplate(text)
      const initialWizardState = workspaceTemplateToWizardState(template)
      navigate('/setup', { state: { initialWizardState } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that workspace file.')
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setText(await file.text())
    setError(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <Link to="/setup" className="text-xs font-medium text-slate-400">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Import a shared timetable</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paste what a classmate sent you, or open the file they shared. This fills in subjects, the timetable, and
          holidays for you — you'll still confirm the dates and set your own attendance target before finishing.
        </p>
      </div>

      <textarea
        className={`${fieldInput} h-40 font-mono text-xs`}
        placeholder="Paste the workspace JSON here…"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setError(null)
        }}
      />

      <div className="flex gap-2">
        <button type="button" className={secondaryButton} onClick={() => fileInputRef.current?.click()}>
          Choose a file instead
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileSelected} />
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      <button type="button" className={primaryButton} disabled={!text.trim()} onClick={handleImport}>
        Continue
      </button>
    </div>
  )
}
