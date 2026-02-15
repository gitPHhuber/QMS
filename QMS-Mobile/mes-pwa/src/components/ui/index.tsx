

import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, forwardRef, useRef, DragEvent, useState, useCallback } from 'react'


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/25',
    secondary: 'bg-slate-600 hover:bg-slate-500 text-white',
    danger: 'bg-danger hover:bg-red-600 text-white',
    success: 'bg-success hover:bg-emerald-600 text-white',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-slate-400 hover:bg-surface-light hover:text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}


interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = ({
  children,
  className = '',
  onClick,
  hover = false,
  padding = 'none'
}: CardProps) => {
  const base = 'bg-surface border border-slate-700/50 rounded-2xl'
  const hoverStyles = hover || onClick ? 'cursor-pointer hover:border-slate-600 hover:bg-surface-light/30 transition-all' : ''
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div
      className={`${base} ${hoverStyles} ${paddings[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}


interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  size?: 'sm' | 'md'
  dot?: boolean
}

export const Badge = ({ children, variant = 'primary', size = 'md', dot = false }: BadgeProps) => {
  const variants = {
    primary: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    neutral: 'bg-slate-600/50 text-slate-400',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }

  const dotColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    neutral: 'bg-slate-500',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-lg ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  )
}


interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-surface-light border border-slate-600 rounded-xl
              px-4 py-2.5 text-white placeholder-slate-500
              focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
              transition-all duration-150
              ${icon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'


export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-surface-light rounded-lg animate-pulse ${className}`} />
)


interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export const Loader = ({ size = 'md', text, fullScreen = false }: LoaderProps) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-primary border-t-transparent rounded-full animate-spin`} />
      {text && <p className="text-slate-400 text-sm">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}


interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-slate-600 mb-4">{icon}</div>}
    <h3 className="text-lg font-medium text-slate-300 mb-2">{title}</h3>
    {description && <p className="text-slate-500 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
)


interface StatsCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: { value: number; label?: string }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

export const StatsCard = ({ title, value, icon, trend, variant = 'default' }: StatsCardProps) => {
  const iconBg = {
    default: 'bg-slate-600/50',
    primary: 'bg-primary/20',
    success: 'bg-success/20',
    warning: 'bg-warning/20',
    danger: 'bg-danger/20',
  }

  const iconColor = {
    default: 'text-slate-400',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400 mb-1 truncate">{title}</p>
          <p className="text-2xl font-bold truncate">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              {trend.label && <span className="text-slate-500 ml-1">{trend.label}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${iconBg[variant]} shrink-0 ml-3`}>
            <div className={iconColor[variant]}>{icon}</div>
          </div>
        )}
      </div>
    </Card>
  )
}


interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface rounded-2xl w-full ${sizes[size]} shadow-2xl animate-slideUp`}>
        {title && (
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}


interface Tab {
  key: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
}

export const Tabs = ({ tabs, activeTab, onChange }: TabsProps) => {
  return (
    <div className="flex gap-1 p-1 bg-surface-light rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            text-sm font-medium transition-all duration-150 whitespace-nowrap
            ${activeTab === tab.key
              ? 'bg-primary text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-surface'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}


interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
}

export const Progress = ({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false
}: ProgressProps) => {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  const heights = { sm: 'h-1.5', md: 'h-2.5' }
  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }

  return (
    <div className="space-y-1">
      <div className={`w-full bg-surface-light rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} ${colors[variant]} rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>{value} / {max}</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
    </div>
  )
}


interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-surface-light border border-slate-600 rounded-xl
            px-4 py-2.5 text-white
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            transition-all duration-150 appearance-none
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'


interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full bg-surface-light border border-slate-600 rounded-xl
            px-4 py-2.5 text-white placeholder-slate-500
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            transition-all duration-150 min-h-[100px] resize-y
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'


interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'success'
  loading?: boolean
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="space-y-4">
      <p className="text-slate-300">{message}</p>
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>{cancelText}</Button>
        <Button variant={variant} className="flex-1" onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    </div>
  </Modal>
)


interface StatusTimelineItem {
  status: string
  label: string
  date?: string
  active?: boolean
  completed?: boolean
}

interface StatusTimelineProps {
  items: StatusTimelineItem[]
}

export const StatusTimeline = ({ items }: StatusTimelineProps) => (
  <div className="space-y-0">
    {items.map((item, i) => (
      <div key={item.status} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full shrink-0 ${
            item.completed ? 'bg-success' : item.active ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-600'
          }`} />
          {i < items.length - 1 && (
            <div className={`w-0.5 flex-1 min-h-[24px] ${item.completed ? 'bg-success/50' : 'bg-slate-700'}`} />
          )}
        </div>
        <div className="pb-4 -mt-0.5">
          <p className={`text-sm font-medium ${
            item.completed ? 'text-success' : item.active ? 'text-primary' : 'text-slate-500'
          }`}>{item.label}</p>
          {item.date && <p className="text-xs text-slate-500">{item.date}</p>}
        </div>
      </div>
    ))}
  </div>
)


interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  maxSizeMb?: number
}

export const FileUpload = ({ onFileSelect, accept, multiple = false, label, maxSizeMb = 50 }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const valid = Array.from(files).filter(f => f.size <= maxSizeMb * 1024 * 1024)
    if (valid.length > 0) onFileSelect(valid)
  }, [onFileSelect, maxSizeMb])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-600 hover:border-slate-500'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="text-slate-400 text-sm">Перетащите файл или нажмите для выбора</p>
        <p className="text-slate-600 text-xs mt-1">Макс. {maxSizeMb} МБ</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}


interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
        <input
          ref={ref}
          type="date"
          className={`
            w-full bg-surface-light border border-slate-600 rounded-xl
            px-4 py-2.5 text-white
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            transition-all duration-150
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    )
  }
)

DateInput.displayName = 'DateInput'


interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ←
      </Button>
      <span className="text-sm text-slate-400 px-3">
        {page} / {totalPages}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        →
      </Button>
    </div>
  )
}
