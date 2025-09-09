'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import Toast from '../ui/Toast'

type ToastVariant = 'success' | 'error' | 'info'
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

type ToastType = {
  id: string
  message: string
  variant: ToastVariant
  position: ToastPosition
  duration: number
  isVisible: boolean
}

type ToastContextType = {
  showToast: (props: {
    message: string
    variant?: ToastVariant
    position?: ToastPosition
    duration?: number
  }) => string
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const showToast = ({
    message,
    variant = 'success',
    position = 'top-right',
    duration = 3000
  }: {
    message: string
    variant?: ToastVariant
    position?: ToastPosition
    duration?: number
  }) => {
    const id = Math.random().toString(36).substring(2, 9)
    
    setToasts(prev => [
      ...prev,
      { id, message, variant, position, duration, isVisible: true }
    ])
    
    return id
  }

  const hideToast = (id: string) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, isVisible: false } : toast
      )
    )
    
    // Remove from state after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 500)
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          variant={toast.variant}
          position={toast.position}
          duration={toast.duration}
          isVisible={toast.isVisible}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  
  return context
}