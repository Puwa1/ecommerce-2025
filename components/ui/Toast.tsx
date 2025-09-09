'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import styles from './Toast.module.css'

type ToastVariant = 'success' | 'error' | 'info'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

interface ToastProps {
  message: string
  variant?: ToastVariant
  position?: ToastPosition
  duration?: number
  onClose?: () => void
  isVisible: boolean
}

const Toast = ({
  message,
  variant = 'success',
  position = 'top-right',
  duration = 3000,
  onClose,
  isVisible
}: ToastProps) => {
  const [isMounted, setIsMounted] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    if (!isVisible) return
    
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [isVisible, duration])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      if (onClose) onClose()
    }, 300) // Animation duration
  }

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return null
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'top-left':
        return 'top-4 left-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-center':
        return 'top-4 left-1/2 -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-4 left-1/2 -translate-x-1/2'
      default:
        return 'top-4 right-4'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-green-50 border-green-200 text-green-800'
    }
  }

  if (!isMounted) return null

  return (
    <div 
      className={`
        fixed z-50 ${getPositionClasses()}
        ${isVisible ? styles.slideInUp : ''}
        ${isClosing ? styles.fadeOut : ''}
        transition-all duration-300 ease-in-out
        pointer-events-auto
      `}
    >
      <div 
        className={`
          flex items-center justify-between
          px-4 py-3 rounded-lg shadow-lg
          border ${getVariantClasses()}
          min-w-[300px] max-w-md
        `}
      >
        <div className="flex items-center space-x-3">
          {getIcon()}
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast