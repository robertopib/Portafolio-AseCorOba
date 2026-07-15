'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'

/**
 * "Publicar cambios" — manual publish button shown in the admin nav.
 *
 * Clicking it POSTs /api/publish (the authenticated endpoint in payload.config),
 * which triggers ONE Vercel rebuild of the front-end. Feedback is surfaced via
 * Payload's toast (react-toastify); a small inline status line is shown as a
 * fallback while in-flight / after completion.
 */
export const PublishButton: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        reason?: string
      }

      if (res.ok && data.ok) {
        toast.success('Publicación iniciada. El sitio se actualizará en unos minutos.')
        setStatus('Publicación iniciada')
      } else if (data.reason === 'no-hook') {
        toast.error('No hay un hook de despliegue configurado.')
        setStatus('Sin hook de despliegue')
      } else if (res.status === 403) {
        toast.error('Debes iniciar sesión para publicar.')
        setStatus('No autorizado')
      } else {
        toast.error('No se pudo publicar. Inténtalo de nuevo.')
        setStatus('Error al publicar')
      }
    } catch {
      toast.error('No se pudo publicar. Revisa tu conexión.')
      setStatus('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '0 var(--base, 20px)', marginBottom: 'var(--base, 20px)' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="btn btn--style-primary btn--size-medium"
        style={{
          width: '100%',
          margin: 0,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Publicando…' : 'Publicar cambios'}
      </button>
      {status && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '0.8rem',
            color: 'var(--theme-elevation-500, #888)',
          }}
        >
          {status}
        </p>
      )}
    </div>
  )
}

export default PublishButton
