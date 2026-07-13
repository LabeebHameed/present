import type { ReactNode } from 'react'

export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
