'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
  }
>(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('grid gap-2', className)}
      role="radiogroup"
      {...props}
    >
      {React.Children.map(props.children, (child) => {
        if (React.isValidElement(child) && typeof child.props === 'object' && child.props !== null) {
          return React.cloneElement(child, {
            ...child.props,
            value,
            onValueChange,
          } as React.Attributes & { value?: string; onValueChange?: (value: string) => void })
        }
        return child
      })}
    </div>
  )
})
RadioGroup.displayName = 'RadioGroup'

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string
    onValueChange?: (value: string) => void
    groupValue?: string
  }
>(({ className, value, onValueChange, groupValue, children, ...props }, ref) => {
  const isSelected = groupValue === value

  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={isSelected}
      className={cn(
        'flex items-center space-x-2 rounded-md border border-gray-200 p-2 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
        isSelected && 'border-blue-500 bg-blue-50',
        className
      )}
      onClick={() => onValueChange?.(value)}
      {...props}
    >
      <div
        className={cn(
          'h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center',
          isSelected && 'border-blue-500'
        )}
      >
        {isSelected && (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        )}
      </div>
      {children}
    </button>
  )
})
RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }
