import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/schema'
import { SetupWizard } from './SetupWizard'

export function SetupPage() {
  const navigate = useNavigate()
  const hasAnySemester = useLiveQuery(async () => (await db.semesters.count()) > 0, [])

  const handleCancel = () => {
    if (hasAnySemester) navigate(-1)
    else navigate('/')
  }

  return <SetupWizard onCancel={handleCancel} />
}
