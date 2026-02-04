import type { Meta, StoryObj } from '@storybook/react'
import { useVaultOraclePrice } from '../hooks/useVaultOraclePrice'

const EXAMPLE_ADDRESSES = {
  USDC: '0xb8ce59fc3717ada4c02eadf9682a9e934f625ebb',
  WETH: '0x4200000000000000000000000000000000000006',
  ORACLE: '0x28675f23E149c25f4f672FAD05f4e71DAfb75048',
  USD_UNIT_OF_ACCOUNT: '0x0000000000000000000000000000000000000348',
}

interface UseVaultOraclePriceDemoProps {
  assetAddress: `0x${string}`
  oracleAddress: `0x${string}`
  unitOfAccount: `0x${string}`
  enabled: boolean
}

function UseVaultOraclePriceDemo({
  assetAddress,
  oracleAddress,
  unitOfAccount,
  enabled,
}: UseVaultOraclePriceDemoProps) {
  const result = useVaultOraclePrice({
    assetAddress,
    oracleAddress,
    unitOfAccount,
    enabled,
  })

  const { priceUSD, isLoading, isError, error, priceInUoA, uoaToUSD, source } = result

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ margin: '0 0 1rem', color: 'rgb(250, 250, 252)' }}>useVaultOraclePrice Hook Demo</h3>
      
      <div style={{ 
        background: 'rgb(48, 48, 55)', 
        padding: '1rem', 
        borderRadius: 8,
        marginBottom: '1rem',
        border: '1px solid rgba(250, 250, 252, 0.05)'
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Parameters</h4>
        <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', background: 'rgb(38, 38, 44)', padding: '0.75rem', borderRadius: 6, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>
{JSON.stringify({
  assetAddress,
  oracleAddress,
  unitOfAccount,
  enabled,
}, null, 2)}
        </pre>
      </div>

      <div style={{ 
        background: isError ? 'rgba(180, 70, 70, 0.15)' : isLoading ? 'rgba(255, 152, 0, 0.15)' : 'rgba(142, 231, 194, 0.15)', 
        padding: '1rem', 
        borderRadius: 8,
        border: `1px solid ${isError ? 'rgba(180, 70, 70, 0.3)' : isLoading ? 'rgba(255, 152, 0, 0.3)' : 'rgba(142, 231, 194, 0.3)'}`
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Result</h4>
        
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Price USD:</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 'bold', color: 'rgb(250, 250, 252)' }}>
              ${priceUSD.toFixed(6)}
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Source:</span>
            <div style={{
              background: 'linear-gradient(135deg, #fbe572 0%, #c2f4bc 100%)',
              padding: 1,
              borderRadius: 7,
              display: 'inline-block',
            }}>
              <div style={{
                background: 'rgb(15, 15, 17)',
                borderRadius: 6,
                padding: '3px 8px',
                color: 'rgb(145, 145, 160)',
                fontSize: 12,
                fontWeight: 500,
              }}>
                {source}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Loading:</span>
            <span style={{ color: 'rgb(250, 250, 252)' }}>{isLoading ? 'Yes' : 'No'}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Error:</span>
            <span style={{ color: isError ? 'rgb(180, 70, 70)' : 'rgb(250, 250, 252)' }}>
              {error?.message || 'None'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ 
        background: 'rgb(38, 38, 44)', 
        padding: '1rem', 
        borderRadius: 8,
        marginTop: '1rem',
        border: '1px solid rgba(250, 250, 252, 0.05)'
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Raw Values (On-chain only)</h4>
        <div style={{ display: 'grid', gap: '0.5rem', fontSize: 12 }}>
          <div>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>Price in UoA (bigint):</span>
            <code style={{ marginLeft: 8, background: 'rgb(48, 48, 55)', padding: '2px 6px', borderRadius: 4, color: 'rgb(250, 250, 252)', fontFamily: "'DM Mono', monospace" }}>{priceInUoA?.toString() || 'N/A'}</code>
          </div>
          <div>
            <span style={{ fontWeight: 500, color: 'rgb(145, 145, 160)' }}>UoA to USD (bigint):</span>
            <code style={{ marginLeft: 8, background: 'rgb(48, 48, 55)', padding: '2px 6px', borderRadius: 4, color: 'rgb(250, 250, 252)', fontFamily: "'DM Mono', monospace" }}>{uoaToUSD?.toString() || 'N/A'}</code>
          </div>
        </div>
      </div>
    </div>
  )
}

const meta: Meta<typeof UseVaultOraclePriceDemo> = {
  title: 'Hooks/useVaultOraclePrice',
  component: UseVaultOraclePriceDemo,
  parameters: {
    docs: {
      description: {
        component: `
Low-level hook to get asset price in USD via vault's oracle contract.

This hook queries on-chain oracle data:
- Asset decimals from the asset's ERC20 contract
- Unit of account decimals (if UoA is not USD)
- Price in UoA from the vault's oracle
- UoA to USD price from the router (if UoA is not USD)

This hook also returns raw bigint values (\`priceInUoA\` and \`uoaToUSD\`) for 
applications that need precise on-chain values.

**Note:** For indexer-based pricing with oracle fallback, use the higher-level 
\`usePrice\` hook which internally fetches from the indexer.
        `,
      },
    },
  },
  argTypes: {
    assetAddress: {
      control: 'text',
      description: 'The asset address to get price for',
    },
    oracleAddress: {
      control: 'text',
      description: 'The vault oracle address',
    },
    unitOfAccount: {
      control: 'text',
      description: 'The vault unit of account address',
    },
    enabled: {
      control: 'boolean',
      description: 'Whether the query is enabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof UseVaultOraclePriceDemo>

export const Default: Story = {
  name: 'Default (On-Chain)',
  args: {
    assetAddress: EXAMPLE_ADDRESSES.USDC as `0x${string}`,
    oracleAddress: EXAMPLE_ADDRESSES.ORACLE as `0x${string}`,
    unitOfAccount: EXAMPLE_ADDRESSES.USD_UNIT_OF_ACCOUNT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches price directly from on-chain oracle contracts.',
      },
    },
  },
}

export const OnChainOnly: Story = {
  name: 'On-Chain Only',
  args: {
    assetAddress: EXAMPLE_ADDRESSES.USDC as `0x${string}`,
    oracleAddress: EXAMPLE_ADDRESSES.ORACLE as `0x${string}`,
    unitOfAccount: EXAMPLE_ADDRESSES.USD_UNIT_OF_ACCOUNT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'The hook fetches price data directly from on-chain contracts.',
      },
    },
  },
}

export const Disabled: Story = {
  name: 'Disabled Query',
  args: {
    assetAddress: EXAMPLE_ADDRESSES.USDC as `0x${string}`,
    oracleAddress: EXAMPLE_ADDRESSES.ORACLE as `0x${string}`,
    unitOfAccount: EXAMPLE_ADDRESSES.USD_UNIT_OF_ACCOUNT as `0x${string}`,
    enabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When enabled is false, no queries are made and default values are returned.',
      },
    },
  },
}

export const WETHPrice: Story = {
  name: 'WETH Price',
  args: {
    assetAddress: EXAMPLE_ADDRESSES.WETH as `0x${string}`,
    oracleAddress: EXAMPLE_ADDRESSES.ORACLE as `0x${string}`,
    unitOfAccount: EXAMPLE_ADDRESSES.USD_UNIT_OF_ACCOUNT as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Example with a higher-value asset like WETH.',
      },
    },
  },
}
