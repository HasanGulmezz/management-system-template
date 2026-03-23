import { useState, useEffect, useRef } from 'react'
import { Lock, X, Delete } from 'lucide-react'
import './PinGuard.css'

interface PinGuardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  autoCloseOnSuccess?: boolean
  correctPin?: string
}

export default function PinGuard({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = 'Güvenlik Doğrulaması',
  autoCloseOnSuccess = true,
  correctPin
}: PinGuardProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get PIN from env or prop (Default to Action PIN "4620")
  const CORRECT_PIN = correctPin || import.meta.env.VITE_APP_PIN || '0000'

  useEffect(() => {
    if (isOpen) {
      setPin('')
      setError(false)
      // Focus hidden input for keyboard support
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num.toString()
      setPin(newPin)
      checkPin(newPin)
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError(false)
  }

  const checkPin = (currentPin: string) => {
    if (currentPin.length === 4) {
      if (currentPin === CORRECT_PIN) {
        // Success
        setTimeout(() => {
          onSuccess()
          if (autoCloseOnSuccess) {
            onClose()
          }
        }, 300)
      } else {
        // Error
        setError(true)
        setTimeout(() => {
          setPin('')
          setError(false)
        }, 1000)
      }
    }
  }

  // Handle physical keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      if (pin.length < 4) {
        const newPin = pin + e.key
        setPin(newPin)
        checkPin(newPin)
      }
    } else if (e.key === 'Backspace') {
      handleDelete()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="pin-guard-overlay" onClick={onClose}>
      <div className="pin-guard-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="hidden-pin-input"
          value={pin}
          onChange={() => {}} // Controlled by keydown
          onKeyDown={handleKeyDown}
          autoFocus
        />
        
        <div className="pin-header">
          <div className="pin-icon-wrapper">
            <Lock size={24} />
          </div>
          <h2 className="pin-title">{title}</h2>
          <p className="pin-subtitle">Devam etmek için 4 haneli PIN giriniz</p>
          <p className="pin-hint" style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-primary, #6366f1)', opacity: 0.8 }}>
            İpucu: Varsayılan şifre <strong style={{ letterSpacing: '2px' }}>0000</strong>
          </p>
        </div>

        <div className={`pin-display ${error ? 'error' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`}></div>
          ))}
        </div>

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className="pin-key"
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </button>
          ))}
          <div className="pin-key empty"></div>
          <button className="pin-key" onClick={() => handleNumberClick(0)}>0</button>
          <button className="pin-key delete" onClick={handleDelete}>
            <Delete size={24} />
          </button>
        </div>

        <button className="pin-close-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
    </div>
  )
}
