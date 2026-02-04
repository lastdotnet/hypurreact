import type { Preview } from '@storybook/react'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { OracleProvider, createOracleConfig } from '../src'

// ============================================================================
// Hypurr Design System - Color Constants (RGB from OKLCH)
// ============================================================================
export const colors = {
  // Backgrounds
  background: 'rgb(28, 28, 32)',
  panel: 'rgb(38, 38, 44)',
  muted: 'rgb(48, 48, 55)',
  card: 'rgb(35, 35, 42)',

  // Text
  foreground: 'rgb(250, 250, 252)',
  mutedForeground: 'rgb(145, 145, 160)',
  dimForeground: 'rgb(110, 110, 125)',

  // Accents
  primary: 'rgb(142, 231, 194)',
  primaryHover: 'rgb(130, 235, 200)',
  primaryForeground: 'rgb(28, 28, 35)',

  // Gradients
  gradientYellow: '#fbe572',
  gradientGreen: '#c2f4bc',

  // Semantic
  error: 'rgb(180, 70, 70)',
  errorBg: 'rgba(180, 70, 70, 0.15)',
  warning: '#ff9800',
  warningBg: 'rgba(255, 152, 0, 0.15)',
  success: 'rgb(142, 231, 194)',
  successBg: 'rgba(142, 231, 194, 0.15)',

  // Borders
  border: 'rgba(250, 250, 252, 0.05)',
  borderLight: 'rgba(250, 250, 252, 0.1)',
  borderLighter: 'rgba(250, 250, 252, 0.15)',
}

// ============================================================================
// Hypurr Design System - Style Patterns
// ============================================================================
export const styles = {
  // Panel/Card container
  panel: {
    background: colors.panel,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    boxShadow: '0px 7px 16px -4px rgba(0, 0, 0, 0.45)',
  },

  // Muted box (for code, parameters)
  mutedBox: {
    background: colors.muted,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    padding: '1rem',
  },

  // Regular badge
  badge: {
    background: colors.muted,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: 500,
  },

  // Gradient badge (wrapper)
  gradientBadgeOuter: {
    background: `linear-gradient(135deg, ${colors.gradientYellow} 0%, ${colors.gradientGreen} 100%)`,
    padding: 1,
    borderRadius: 7,
    display: 'inline-block',
  },
  gradientBadgeInner: {
    background: 'rgb(15, 15, 17)',
    borderRadius: 6,
    padding: '3px 8px',
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: 500,
  },

  // Primary button
  buttonPrimary: {
    background: colors.primary,
    color: colors.primaryForeground,
    borderRadius: 8,
    border: 'none',
    padding: '8px 16px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    transition: 'background 0.2s',
  },

  // Ghost button
  buttonGhost: {
    background: 'rgba(255, 255, 255, 0.03)',
    color: colors.mutedForeground,
    border: `1px solid ${colors.borderLight}`,
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontFamily: "'Manrope', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
  },

  // Code/monospace text
  code: {
    fontFamily: "'DM Mono', monospace",
    background: colors.muted,
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 12,
    color: colors.mutedForeground,
  },

  // Price display
  price: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "'DM Mono', monospace",
    color: colors.foreground,
  },
}

// ============================================================================
// Global CSS for animations and fonts
// ============================================================================
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .hypurr-skeleton {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .hypurr-spin {
    animation: spin 1s linear infinite;
  }

  .hypurr-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
`

// ============================================================================
// Chain & Provider Configuration (unchanged)
// ============================================================================
const hyperEVM = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
} as const

const wagmiConfig = createConfig({
  chains: [hyperEVM, mainnet],
  transports: {
    [hyperEVM.id]: http(),
    [mainnet.id]: http(),
  },
})

const oracleConfig = createOracleConfig({
  chainId: 999,
  routerAddress: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  usdUnitOfAccount: '0x0000000000000000000000000000000000000348',
  usdReferenceToken: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  indexerUrl: 'https://indexer-hyperevm-api-prod.up.railway.app',
  indexerStaleTime: 30_000,
  vaultLensAddress: '0x0eaDDE9EfCf1540dcA8f94e813E12db55f8405a8',
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5,
    },
  },
})

// ============================================================================
// Storybook Decorator with Dark Theme
// ============================================================================
const withProviders = (Story: React.ComponentType) => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <OracleProvider config={oracleConfig}>
        <style>{globalStyles}</style>
        <div
          style={{
            padding: '1.5rem',
            fontFamily: "'Manrope', sans-serif",
            background: colors.background,
            minHeight: '100vh',
            color: colors.foreground,
          }}
          className="hypurr-fade-in"
        >
          <Story />
        </div>
      </OracleProvider>
    </QueryClientProvider>
  </WagmiProvider>
)

// ============================================================================
// Storybook Preview Configuration
// ============================================================================
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: colors.background },
        { name: 'panel', value: colors.panel },
      ],
    },
    layout: 'fullscreen',
  },
  decorators: [withProviders],
}

export default preview
