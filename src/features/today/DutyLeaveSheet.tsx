import { useState } from 'react'
import { BottomSheet } from '../../components/BottomSheet'
import { fieldInput, fieldLabel, primaryButton } from '../setup/inputStyles'
import { setDutyLeave } from '../../lib/recordActions'
import type { DutyLeaveInfo, DutyLeaveReason } from '../../db/types'

const REASONS: DutyLeaveReason[] = ['NSS', 'IEDC', 'Hackathon', 'Sports', 'Placement', 'Medical', 'Other']

export function DutyLeaveSheet({
  semesterId,
  date,
  periodIndex,
  subjectId,
  subjectName,
  existing,
  onClose,
}: {
  semesterId: string
  date: string
  periodIndex: number
  subjectId: string
  subjectName: string
  existing?: DutyLeaveInfo
  onClose: () => void
}) {
  const [reason, setReason] = useState<DutyLeaveReason>(existing?.reason ?? 'NSS')
  const [note, setNote] = useState(existing?.note ?? '')
  const [proof, setProof] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDutyLeave({
        semesterId,
        date,
        periodIndex,
        subjectId,
        dutyLeave: {
          reason,
          note: note.trim() || undefined,
          proofBlob: proof ?? existing?.proofBlob,
          proofName: proof?.name ?? existing?.proofName,
        },
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet title={`Duty leave — ${subjectName}`} onClose={onClose}>
      <div className="flex flex-col gap-1">
        <span className={fieldLabel}>Reason</span>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                reason === r
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={fieldLabel} htmlFor="dl-note">
          Note (optional)
        </label>
        <textarea
          id="dl-note"
          className={fieldInput}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className={fieldLabel}>Proof (optional)</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setProof(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-500 dark:text-slate-400"
        />
        {(proof?.name ?? existing?.proofName) && (
          <span className="text-xs text-slate-400">Attached: {proof?.name ?? existing?.proofName}</span>
        )}
      </div>

      <button type="button" className={primaryButton} disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save duty leave'}
      </button>
    </BottomSheet>
  )
}
