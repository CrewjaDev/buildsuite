declare module 'next-pwa' {
  import { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    register?: boolean
    skipWaiting?: boolean
    disable?: boolean
    [key: string]: unknown
  }

  interface WithPWAConfig {
    pwa?: PWAConfig
  }

  function withPWA(config?: WithPWAConfig): (nextConfig: NextConfig) => NextConfig

  export default withPWA
}
