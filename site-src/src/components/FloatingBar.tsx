import { useEffect, useState, useCallback } from 'react'

interface Props {
  totalMins: number
}

const UP_PATH = "M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM441 335C450.4 344.4 450.4 359.6 441 368.9C431.6 378.2 416.4 378.3 407.1 368.9L320.1 281.9L233.1 368.9C223.7 378.3 208.5 378.3 199.2 368.9C189.9 359.5 189.8 344.3 199.2 335L303 231C312.4 221.6 327.6 221.6 336.9 231L441 335z"
const DOWN_PATH = "M320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64zM199 305C189.6 295.6 189.6 280.4 199 271.1C208.4 261.8 223.6 261.7 232.9 271.1L319.9 358.1L406.9 271.1C416.3 261.7 431.5 261.7 440.8 271.1C450.1 280.5 450.2 295.7 440.8 305L337 409C327.6 418.4 312.4 418.4 303.1 409L199 305z"

function icon(path: string, size: number) {
  return `<svg viewBox="0 0 640 640" width="${size}" height="${size}" fill="currentColor"><path d="${path}"/></svg>`
}

export default function FloatingBar({ totalMins }: Props) {
  const [minsLeft, setMinsLeft] = useState(totalMins)
  const [atBottom, setAtBottom] = useState(false)

  const update = useCallback(() => {
    const el = document.querySelector('.article-body')
    const scrollY = window.scrollY
    const winH = window.innerHeight
    const docH = document.documentElement.scrollHeight
    setAtBottom(scrollY + winH >= docH - 80)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const articleTop = scrollY + rect.top
    const articleH = (el as HTMLElement).offsetHeight
    const read = Math.max(0, scrollY - articleTop)
    const progress = Math.min(1, read / articleH)
    setMinsLeft(Math.max(0, Math.round(totalMins * (1 - progress))))
  }, [totalMins])

  useEffect(() => {
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [update])

  const ICON_SIZE = 48

  useEffect(() => {
    const leftEl = document.createElement('div')
    leftEl.className = 'floating-time'
    leftEl.innerHTML = `<div class="floating-time__circle"><span class="floating-time__label">${minsLeft === 0 ? '✓' : minsLeft + ' m'}</span></div>`
    document.body.appendChild(leftEl)

    const rightEl = document.createElement('div')
    rightEl.className = 'floating-nav'
    rightEl.innerHTML = `
      <button class="floating-nav__btn" id="fn-up" title="Back to top">${icon(UP_PATH, ICON_SIZE)}</button>
      <button class="floating-nav__btn" id="fn-down" title="Scroll to bottom">${icon(DOWN_PATH, ICON_SIZE)}</button>
    `
    document.body.appendChild(rightEl)

    const up = document.getElementById('fn-up')
    const down = document.getElementById('fn-down')
    if (up) up.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' })
    if (down) down.onclick = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })

    return () => {
      document.body.removeChild(leftEl)
      document.body.removeChild(rightEl)
    }
  }, [])

  useEffect(() => {
    const el = document.querySelector('.floating-time__label')
    if (el) el.textContent = minsLeft === 0 ? '✓' : `${minsLeft} m`
  }, [minsLeft])

  useEffect(() => {
    const btn = document.getElementById('fn-down')
    if (btn) btn.className = `floating-nav__btn${atBottom ? ' floating-nav__btn--dim' : ''}`
  }, [atBottom])

  return null
}
