'use client'
import { useEffect, useRef } from 'react'

export function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    let id: number
    const dpr = Math.min(devicePixelRatio||1,2)
    const resize = () => { canvas.width=innerWidth*dpr; canvas.height=innerHeight*dpr; canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px'; ctx.scale(dpr,dpr) }
    resize()
    window.addEventListener('resize', resize, { passive:true })
    const pts = Array.from({length:32},()=>({ x:Math.random()*innerWidth, y:Math.random()*innerHeight, vx:(Math.random()-.5)*.22, vy:(Math.random()-.5)*.22, a:Math.random()*.3+.06 }))
    const draw = () => {
      ctx.clearRect(0,0,innerWidth,innerHeight)
      pts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; if(p.x<0)p.x=innerWidth; if(p.x>innerWidth)p.x=0; if(p.y<0)p.y=innerHeight; if(p.y>innerHeight)p.y=0; ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fillStyle=`rgba(184,134,11,${p.a})`; ctx.fill() })
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++) { const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy); if(d<150){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(184,134,11,${.05*(1-d/150)})`;ctx.lineWidth=.5;ctx.stroke()} }
      id = requestAnimationFrame(draw)
    }
    draw()
    return ()=>{ cancelAnimationFrame(id); window.removeEventListener('resize',resize) }
  },[])
  return <canvas ref={ref} style={{ position:'absolute',inset:0,pointerEvents:'none',zIndex:0,opacity:.8 }}/>
}
