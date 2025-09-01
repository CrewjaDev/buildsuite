export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  timestamp: Date
  link?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface NotificationGroup {
  id: string
  title: string
  notifications: Notification[]
  unreadCount: number
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  categories: {
    project: boolean
    task: boolean
    system: boolean
    security: boolean
  }
}
