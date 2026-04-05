'use client'
import { useEffect, useState } from 'react'

interface MarqueeItem { id: string; text: string; emoji?: string }

const DEFAULTS: MarqueeItem[] = [
  { id:'1', emoji:'🏫', text:'12,000+ Verified Schools Across India' },
  { id:'2', emoji:'⭐', text:'Trusted by 1 Lakh+ Parents' },
  { id:'3', emoji:'🎓', text:'CBSE · ICSE · IB · State Board Schools' },
  { id:'4', emoji:'🏙️', text:'Schools in 350+ Indian Cities' },
  { id:'5', emoji:'🤖', text:'AI-Powered School Recommendations' },
  { id:'6', emoji:'✅', text:'Free to Use for Parents — Always' },
  { id:'7', emoji:'📋', text:'One-Click Admission Applications' },
  { id:'8', emoji:'💬', text:'1-on-1 Expert Counselling Available' },
]

interface Props {
  variant?: 'light' | 'dark' | 'gold'
  speed?: number // seconds per full loop
}

export function Marquee({ variant = 'light', speed = 38 }: Props) {
  const [items, setItems] = useState<MarqueeItem[]>(DEFAULTS)

  useEffect(() => {
    fetch('/api/admin?action=marquee-items')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.items?.length >= 4) setItems(d.items) })
      .catch(() => {})
  }, [])

  // Double items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className={`ts-marquee-outer ts-marquee-${variant}`} style={{ '--marquee-dur': `${speed}s` } as React.CSSProperties}>
      <div className="ts-marquee-track">
        {doubled.map((item, i) => (
          <span key={`${item.id}-${i}`} className="ts-marquee-item">
            {item.emoji && <span style={{ fontSize: 15 }}>{item.emoji}</span>}
            {item.text}
            <span className="ts-marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  )
}
