'use client'

import { useReadContract } from 'wagmi'
import type { Address } from 'viem'
import { eulerEarnVaultLensAbi } from '../abis'
import { useVaultConfig } from '../context'
import type { EarnVaultInfo, EarnStrategy, EarnStrategyStatus } from '../types/earnVaultInfo'

export interface UseEarnVaultLensDataParams {
  vaultAddress: Address
  enabled?: boolean
}

export interface UseEarnVaultLensDataResult {
  data: Partial<EarnVaultInfo> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

interface EarnVaultLensStrategyRaw {
  strategy: Address
  allocatedAssets: bigint
  availableAssets: bigint
  currentAllocationCap: bigint
  pendingAllocationCap: bigint
  pendingAllocationCapValidAt: bigint
  removableAt: bigint
  info: {
    timestamp: bigint
    vault: Address
    vaultName: string
    vaultSymbol: string
    vaultDecimals: bigint
    asset: Address
    assetName: string
    assetSymbol: string
    assetDecimals: bigint
    totalShares: bigint
    totalAssets: bigint
    isEVault: boolean
  }
}

interface EarnVaultLensRawResult {
  timestamp: bigint
  vault: Address
  vaultName: string
  vaultSymbol: string
  vaultDecimals: bigint
  asset: Address
  assetName: string
  assetSymbol: string
  assetDecimals: bigint
  totalShares: bigint
  totalAssets: bigint
  lostAssets: bigint
  availableAssets: bigint
  timelock: bigint
  performanceFee: bigint
  feeReceiver: Address
  owner: Address
  creator: Address
  curator: Address
  guardian: Address
  evc: Address
  permit2: Address
  pendingTimelock: bigint
  pendingTimelockValidAt: bigint
  pendingGuardian: Address
  pendingGuardianValidAt: bigint
  supplyQueue: Address[]
  strategies: EarnVaultLensStrategyRaw[]
}

function getStrategyStatus(strategy: EarnVaultLensStrategyRaw): EarnStrategyStatus {
  const now = BigInt(Math.floor(Date.now() / 1000))
  if (strategy.removableAt > 0n && strategy.removableAt < now) {
    return 'removed'
  }
  if (strategy.removableAt > 0n) {
    return 'pending_removal'
  }
  return 'active'
}

function transformStrategy(raw: EarnVaultLensStrategyRaw): EarnStrategy {
  return {
    strategy: raw.strategy,
    strategyVaultName: raw.info.vaultName,
    strategyVaultSymbol: raw.info.vaultSymbol,
    allocatedAssets: raw.allocatedAssets,
    allocatedAssetsUSD: null, // On-chain doesn't have USD values
    availableAssets: raw.availableAssets,
    currentAllocationCap: raw.currentAllocationCap,
    pendingAllocationCap: raw.pendingAllocationCap,
    pendingAllocationCapValidAt: raw.pendingAllocationCapValidAt,
    removableAt: raw.removableAt,
    status: getStrategyStatus(raw),
  }
}

function transformEarnVaultLensData(raw: EarnVaultLensRawResult): Partial<EarnVaultInfo> {
  const strategies = raw.strategies.map(transformStrategy)

  return {
    vault: raw.vault,
    vaultName: raw.vaultName,
    vaultSymbol: raw.vaultSymbol,
    vaultDecimals: Number(raw.vaultDecimals),
    asset: raw.asset,
    assetName: raw.assetName,
    assetSymbol: raw.assetSymbol,
    assetDecimals: Number(raw.assetDecimals),

    totalShares: raw.totalShares,
    totalAssets: raw.totalAssets,
    totalAssetsUSD: null, // On-chain doesn't have USD values
    availableAssets: raw.availableAssets,
    availableAssetsUSD: null, // On-chain doesn't have USD values
    lostAssets: raw.lostAssets,

    // APY values are not available on-chain (require historical data)
    apy7d: null,
    apy30d: null,
    apy90d: null,
    apyCurrent: null,

    performanceFee: raw.performanceFee,
    feeReceiver: raw.feeReceiver,
    timelock: raw.timelock,
    owner: raw.owner,
    creator: raw.creator,
    curator: raw.curator,
    guardian: raw.guardian,
    evc: raw.evc,
    permit2: raw.permit2,

    supplyQueue: raw.supplyQueue,
    strategies,
  }
}

// Default EulerEarnVaultLens address for HyperEVM (chainId: 999)
const DEFAULT_EARN_VAULT_LENS_ADDRESS: Record<number, Address> = {
  999: '0x782A21Ab6eEa4919Fd2F1B6e94c2BE3349A71233',
}

export function useEarnVaultLensData({
  vaultAddress,
  enabled = true,
}: UseEarnVaultLensDataParams): UseEarnVaultLensDataResult {
  const config = useVaultConfig()

  // Use the default EulerEarnVaultLens address for the chain
  const earnVaultLensAddress = DEFAULT_EARN_VAULT_LENS_ADDRESS[config.chainId]
  const hasEarnVaultLens = !!earnVaultLensAddress

  const query = useReadContract({
    address: earnVaultLensAddress,
    abi: eulerEarnVaultLensAbi,
    functionName: 'getVaultInfoFull',
    args: [vaultAddress],
    chainId: config.chainId,
    query: {
      enabled: enabled && hasEarnVaultLens && !!vaultAddress,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  })

  const transformedData = query.data
    ? transformEarnVaultLensData(query.data as unknown as EarnVaultLensRawResult)
    : undefined

  return {
    data: transformedData,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
