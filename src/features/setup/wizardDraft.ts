import { db } from '../../db/schema'
import type { WizardState } from './wizardState'

const DRAFT_KEY = 'setupWizardDraft'

export interface WizardDraft {
  state: WizardState
  stepIndex: number
}

export async function loadWizardDraft(): Promise<WizardDraft | undefined> {
  const row = await db.settings.get(DRAFT_KEY)
  return row?.value as WizardDraft | undefined
}

export async function saveWizardDraft(draft: WizardDraft): Promise<void> {
  await db.settings.put({ key: DRAFT_KEY, value: draft })
}

export async function clearWizardDraft(): Promise<void> {
  await db.settings.delete(DRAFT_KEY)
}
