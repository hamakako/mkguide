import { useState } from 'react'

type Props = { src: string; alt: string; className?: string; eager?: boolean }

export function BrandedImage({ src, alt, className = '', eager = false }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className={`image-fallback ${className}`}><img src="/brand/mk-logo.png" alt="MK" /></div>
  return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
}
