import styles from '@/styles/Button.module.css'
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export default function Button({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}: ButtonProps) {
  const buttonClass = variant === 'primary' ? styles.primary : styles.secondary
  
  return (
    <button 
      className={`${buttonClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
} 