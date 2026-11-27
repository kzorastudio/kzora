/**
 * Draw the eye to one element: scroll it into view, dim the rest of the page,
 * and glow around the element for a short moment, then fade away on its own.
 * Purely visual — the overlay never blocks clicks or typing.
 */

const OVERLAY_ID = 'kz-spotlight'
const HOLD_MS = 2200   // how long the spotlight stays fully on
const FADE_MS = 450    // fade in / fade out duration
const PAD = 8          // breathing room around the element

let cleanup: (() => void) | null = null

export function spotlightElement(el: HTMLElement) {
  if (typeof window === 'undefined') return
  cleanup?.()

  el.scrollIntoView({ behavior: 'smooth', block: 'center' })

  const focusable = el.matches('input, textarea, select, button')
    ? el
    : el.querySelector<HTMLElement>('input:not([type=hidden]):not(.sr-only), textarea, select, button')
  focusable?.focus({ preventScroll: true })

  const radius = parseFloat(getComputedStyle(el).borderRadius) || 0

  const box = document.createElement('div')
  box.id = OVERLAY_ID
  box.setAttribute('aria-hidden', 'true')
  Object.assign(box.style, {
    position: 'fixed',
    zIndex: '9999',
    pointerEvents: 'none',
    borderRadius: `${radius + PAD}px`,
    // giant shadow = the dimmed page; inner rings = the glow on the element
    boxShadow:
      '0 0 0 3px #B8860B, 0 0 28px 8px rgba(184,134,11,0.65), 0 0 0 200vmax rgba(15,12,8,0.62)',
    opacity: '0',
    transition: `opacity ${FADE_MS}ms ease`,
  })
  document.body.appendChild(box)

  // follow the element while the page scrolls / reflows
  let raf = 0
  const track = () => {
    const r = el.getBoundingClientRect()
    box.style.top = `${r.top - PAD}px`
    box.style.left = `${r.left - PAD}px`
    box.style.width = `${r.width + PAD * 2}px`
    box.style.height = `${r.height + PAD * 2}px`
    raf = requestAnimationFrame(track)
  }
  track()
  requestAnimationFrame(() => { box.style.opacity = '1' })

  const dismiss = () => { box.style.opacity = '0' }
  const hideTimer = window.setTimeout(dismiss, HOLD_MS + FADE_MS)
  const removeTimer = window.setTimeout(() => cleanup?.(), HOLD_MS + FADE_MS * 2)
  // the moment the customer starts filling it in, let the page come back
  const onInput = () => dismiss()
  el.addEventListener('input', onInput)
  el.addEventListener('change', onInput)

  cleanup = () => {
    cancelAnimationFrame(raf)
    clearTimeout(hideTimer)
    clearTimeout(removeTimer)
    el.removeEventListener('input', onInput)
    el.removeEventListener('change', onInput)
    box.remove()
    cleanup = null
  }
}

/**
 * Given the names of fields with errors, spotlight the first one on the page
 * (top-to-bottom order). Elements opt in with `data-spotlight="<field name>"`.
 */
export function spotlightFirstInvalid(fieldNames: string[], root: ParentNode = document) {
  if (!fieldNames.length) return
  const wanted = new Set(fieldNames)
  const target = Array.from(root.querySelectorAll<HTMLElement>('[data-spotlight]'))
    .find(n => wanted.has(n.dataset.spotlight ?? ''))
  if (target) spotlightElement(target)
}
