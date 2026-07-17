import { useEffect, useState } from 'react'

/**
 * Scroll-spy : suit la section module la plus visible pour surligner sa carte
 * d'aperçu (« en cours de lecture »). Observe `#${prefix}${key}` via
 * IntersectionObserver. Dégrade proprement (retourne null) si l'API est absente
 * (jsdom, SSR). `sectionKeys` doit être stable (mémoïsé par l'appelant).
 */
export function useActiveSection(sectionKeys: readonly string[], prefix = 'evo-section-'): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || sectionKeys.length === 0) return
    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          const key = e.target.getAttribute('data-section') ?? ''
          ratios.set(key, e.isIntersecting ? e.intersectionRatio : 0)
        }
        let best: string | null = null
        let bestRatio = 0
        for (const [key, ratio] of ratios) {
          if (ratio > bestRatio) { bestRatio = ratio; best = key }
        }
        setActive(best)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-80px 0px -45% 0px' },
    )
    for (const key of sectionKeys) {
      const el = document.getElementById(`${prefix}${key}`)
      if (el != null) {
        el.setAttribute('data-section', key)
        observer.observe(el)
      }
    }
    return () => observer.disconnect()
  }, [sectionKeys, prefix])

  return active
}
