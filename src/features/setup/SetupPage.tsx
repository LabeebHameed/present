import { useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { SetupWizard } from './SetupWizard'
import type { WizardState } from './wizardState'

export function SetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const hasAnySemester = useLiveQuery(async () => (await db.semesters.count()) > 0, [])
  const initialWizardState = (location.state as { initialWizardState?: WizardState } | null)?.initialWizardState

  const handleCancel = () => {
    if (hasAnySemester) navigate(-1)
    else navigate('/')
  }

  return <SetupWizard onCancel={handleCancel} initialState={initialWizardState} />
}
