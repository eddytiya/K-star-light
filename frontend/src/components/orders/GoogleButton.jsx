import { useEffect, useRef, useState } from 'react'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const GoogleButton = ({ onCredential, text = 'signin_with' }) => {
  const container = useRef(null)
  const callback = useRef(onCredential)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])
  useEffect(() => {
    if (!clientId) return
    let active = true
    const render = () => {
      if (!active || !container.current || !window.google?.accounts?.id) return
      container.current.replaceChildren()
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => callback.current(response.credential)
      })
      window.google.accounts.id.renderButton(container.current, {
        theme: 'outline',
        size: 'large',
        text,
        width: Math.min(container.current.clientWidth, 360)
      })
    }
    if (window.google?.accounts?.id) render()
    else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = render
      script.onerror = () => {
        if (active) setFailed(true)
      }
      document.head.appendChild(script)
    }
    return () => {
      active = false
    }
  }, [text])
  if (!clientId)
    return (
      <p className="google-note">
        Google sign-in will appear after the site owner configures its Google client ID.
      </p>
    )
  return (
    <div className="google-button-slot" ref={container}>
      {failed && <p>Google sign-in could not load. Use email and password instead.</p>}
    </div>
  )
}

export default GoogleButton
