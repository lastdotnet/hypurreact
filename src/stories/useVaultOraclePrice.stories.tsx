import type { Meta, StoryObj } from '@storybook/react'
import { useReadContracts } from 'wagmi'
import { eVaultImplementationAbi } from '../abis'
import { useVaultOraclePrice } from '../hooks/useVaultOraclePrice'

const DEMO_VAULTS = {
  USDC: '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
  WHYPE: '0xF73c654d468f5485bF15F3470B78851a49257704',
  UBTC: '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
}

interface UseVaultOraclePriceDemoProps {
  vaultAddress: `0x${string}`
  enabled: boolean
}

function UseVaultOraclePriceDemo({
  vaultAddress,
  enabled,
}: UseVaultOraclePriceDemoProps) {
  const {
    data: vaultData,
    isLoading: isVaultLoading,
  } = useReadContracts({
    contracts: [
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'oracle',
      },
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'unitOfAccount',
      },
      {
        address: vaultAddress,
        abi: eVaultImplementationAbi,
        functionName: 'asset',
      },
    ],
    query: { enabled },
  })

  const oracleAddress = vaultData?.[0]?.result as `0x${string}` | undefined
  const unitOfAccount = vaultData?.[1]?.result as `0x${string}` | undefined
  const assetAddress = vaultData?.[2]?.result as `0x${string}` | undefined

  const result = useVaultOraclePrice({
    assetAddress,
    oracleAddress,
    unitOfAccount,
    enabled: enabled && !!oracleAddress && !!unitOfAccount && !!assetAddress,
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
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Vault Input</h4>
        <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', background: 'rgb(38, 38, 44)', padding: '0.75rem', borderRadius: 6, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>
{JSON.stringify({ vaultAddress, enabled }, null, 2)}
        </pre>
      </div>

      <div style={{ 
        background: 'rgb(48, 48, 55)', 
        padding: '1rem', 
        borderRadius: 8,
        marginBottom: '1rem',
        border: '1px solid rgba(250, 250, 252, 0.05)'
      }}>
        <h4 style={{ margin: '0 0 0.5rem', fontSize: 14, color: 'rgb(145, 145, 160)' }}>Fetched from Vault (on-chain)</h4>
        {isVaultLoading ? (
          <div style={{ color: 'rgb(145, 145, 160)' }}>Loading vault data...</div>
        ) : (
          <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', background: 'rgb(38, 38, 44)', padding: '0.75rem', borderRadius: 6, color: 'rgb(145, 145, 160)', fontFamily: "'DM Mono', monospace" }}>
{JSON.stringify({
  oracleAddress: oracleAddress || 'N/A',
  unitOfAccount: unitOfAccount || 'N/A',
  assetAddress: assetAddress || 'N/A',
}, null, 2)}
          </pre>
        )}
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
    vaultAddress: {
      control: 'select',
      options: Object.values(DEMO_VAULTS),
      description: 'The vault address to fetch oracle data from',
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
  name: 'USDC Vault',
  args: {
    vaultAddress: DEMO_VAULTS.USDC as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches oracle address from USDC vault, then queries price on-chain.',
      },
    },
  },
}

export const WHYPEVault: Story = {
  name: 'WHYPE Vault',
  args: {
    vaultAddress: DEMO_VAULTS.WHYPE as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches oracle address from WHYPE vault, then queries price on-chain.',
      },
    },
  },
}

export const UBTCVault: Story = {
  name: 'UBTC Vault',
  args: {
    vaultAddress: DEMO_VAULTS.UBTC as `0x${string}`,
    enabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fetches oracle address from UBTC vault, then queries price on-chain.',
      },
    },
  },
}

export const Disabled: Story = {
  name: 'Disabled Query',
  args: {
    vaultAddress: DEMO_VAULTS.USDC as `0x${string}`,
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
