// src/app/(public)/reserve/confirm/page.tsx
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

interface Props {
  searchParams: Promise<{ name?: string; date?: string; time?: string; party?: string; waiting?: string }>
}

export default async function ConfirmPage({ searchParams }: Props) {
  const params = await searchParams
  const isWaiting = params.waiting === '1'

  return (
    <main className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-slide-up">
        <div className="flex justify-center mb-6">
          {isWaiting ? (
            <div className="w-20 h-20 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <span className="text-3xl">⏳</span>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {isWaiting ? 'נוספת לרשימת ההמתנה' : 'ההזמנה התקבלה!'}
        </h1>

        <p className="text-gray-400 mb-6 leading-relaxed">
          {isWaiting
            ? 'אין מקום פנוי לבקשה שלך כרגע. הוספנו אותך לרשימת ההמתנה ונצור קשר אם יפנה מקום.'
            : `תודה ${params.name || ''}! קיבלנו את הבקשה שלך ל-${params.party || ''} סועדים בתאריך ${params.date || ''} בשעה ${params.time || ''}. נאשר בהקדם.`
          }
        </p>

        {!isWaiting && (
          <div className="card mb-6 text-right">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">שם</p>
                <p className="text-white font-medium">{params.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">מספר סועדים</p>
                <p className="text-white font-medium">{params.party}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">תאריך</p>
                <p className="text-white font-medium">{params.date}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">שעה</p>
                <p className="text-white font-medium">{params.time}</p>
              </div>
            </div>
          </div>
        )}

        <Link href="/reserve" className="btn-secondary inline-flex items-center gap-2">
          הזמן שולחן נוסף
        </Link>
      </div>
    </main>
  )
}
