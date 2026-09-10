import type { ReactNode } from 'react'
import { createElement, Fragment } from 'react'

/** Convierte texto con **negrita** en nodos React. */
export function renderRichText(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    const match = /^\*\*([^*]+)\*\*$/.exec(part)
    if (match) {
      return createElement('strong', { key: index }, match[1])
    }
    return createElement(Fragment, { key: index }, part)
  })
}
