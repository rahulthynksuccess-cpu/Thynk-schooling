'use client'
import { useEffect, useRef } from 'react'

// Lightweight canvas particle system — no external deps
export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Particles
    const COUNT = 28
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.35 + 0.08,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const W = window.innerWidth, H = window.innerHeight

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(184,134,11,${p.alpha})`
        ctx.fill()
      })

      // Draw faint connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 160) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(184,134,11,${0.06 * (1 - dist / 160)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', zIndex: 0,
        opacity: 0.7,
      }}
    />
  )
}

// Floating orb blobs — pure CSS, zero JS after mount
export function FloatingOrbs({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const orbs = variant === 'dark'
    ? [
        { size: 500, top: '-15%', left: '-8%',  color: 'rgba(184,134,11,0.07)',  dur: '18s', delay: '0s' },
        { size: 400, top: '60%',  right: '-10%', color: 'rgba(10,95,85,0.05)',   dur: '22s', delay: '-7s' },
        { size: 300, top: '30%',  left: '40%',   color: 'rgba(184,134,11,0.04)', dur: '15s', delay: '-4s' },
      ]
    : [
        { size: 600, top: '-20%', right: '-12%', color: 'rgba(184,134,11,0.07)', dur: '20s', delay: '0s' },
        { size: 450, top: '50%',  left: '-10%',  color: 'rgba(10,95,85,0.04)',   dur: '25s', delay: '-9s' },
        { size: 350, top: '20%',  left: '50%',   color: 'rgba(184,134,11,0.04)', dur: '17s', delay: '-5s' },
      ]

  return (
    <>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: 'absolute',
          width:  o.size + 'px',
          height: o.size + 'px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          top:   o.top   ?? 'auto',
          left:  (o as any).left  ?? 'auto',
          right: (o as any).right ?? 'auto',
          pointerEvents: 'none',
          animation: `orbFloat ${o.dur} ease-in-out infinite`,
          animationDelay: o.delay,
          willChange: 'transform',
          zIndex: 0,
        }} />
      ))}
    </>
  )
}

// Scroll-triggered number counter
export function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const dur = 1800
        const start = performance.now()
        const tick = (now: number) => {
          const prog = Math.min((now - start) / dur, 1)
          const ease = 1 - Math.pow(1 - prog, 3)
          el.textContent = Math.round(ease * to).toLocaleString('en-IN') + suffix
          if (prog < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, suffix])

  return <span ref={ref}>0{suffix}</span>
}
