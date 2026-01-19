import { useEffect } from 'react'

export function useMathJax(dependencies = []) {
  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise().catch((err) => {
        console.error('MathJax rendering error:', err)
      })
    }
  }, dependencies)
}
