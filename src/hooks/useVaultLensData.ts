'use client'

import { useReadContract } from 'wagmi'
import type { Address } from 'viem'
import { vaultLensAbi } from '../abis'
import { useVaultConfig } from '../context'
import type {
  VaultInfo,
  LTVInfo,
  InterestRateInfo,
  InterestRateModelInfo,
} from '../types/vaultInfo'

export interface UseVaultLensDataParams {
  vaultAddress: Address
  enabled?: boolean
}

export interface UseVaultLensDataResult {
  data: Partial<VaultInfo> | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
}

interface VaultLensRawResult {
  timestamp: bigint
  vault: Address
  vaultName: string
  vaultSymbol: string
  vaultDecimals: bigint
  asset: Address
  assetName: string
  assetSymbol: string
  assetDecimals: bigint
  unitOfAccount: Address
  unitOfAccountName: string
  unitOfAccountSymbol: string
  unitOfAccountDecimals: bigint
  totalShares: bigint
  totalCash: bigint
  totalBorrowed: bigint
  totalAssets: bigint
  accumulatedFeesShares: bigint
  accumulatedFeesAssets: bigint
  governorFeeReceiver: Address
  protocolFeeReceiver: Address
  protocolFeeShare: bigint
  interestFee: bigint
  hookedOperations: bigint
  configFlags: bigint
  supplyCap: bigint
  borrowCap: bigint
  maxLiquidationDiscount: bigint
  liquidationCoolOffTime: bigint
  dToken: Address
  oracle: Address
  interestRateModel: Address
  hookTarget: Address
  evc: Address
  protocolConfig: Address
  balanceTracker: Address
  permit2: Address
  creator: Address
  governorAdmin: Address
  irmInfo: {
    queryFailure: boolean
    queryFailureReason: `0x${string}`
    vault: Address
    interestRateModel: Address
    interestRateInfo: Array<{
      cash: bigint
      borrows: bigint
      borrowSPY: bigint
      borrowAPY: bigint
      supplyAPY: bigint
    }>
    interestRateModelInfo: {
      interestRateModel: Address
      interestRateModelType: number
      interestRateModelParams: `0x${string}`
    }
  }
  collateralLTVInfo: Array<{
    collateral: Address
    borrowLTV: bigint
    liquidationLTV: bigint
    initialLiquidationLTV: bigint
    targetTimestamp: bigint
    rampDuration: bigint
  }>
  liabilityPriceInfo: {
    queryFailure: boolean
    queryFailureReason: `0x${string}`
    timestamp: bigint
    oracle: Address
    asset: Address
    unitOfAccount: Address
    amountIn: bigint
    amountOutMid: bigint
    amountOutBid: bigint
    amountOutAsk: bigint
  }
  collateralPriceInfo: Array<{
    queryFailure: boolean
    queryFailureReason: `0x${string}`
    timestamp: bigint
    oracle: Address
    asset: Address
    unitOfAccount: Address
    amountIn: bigint
    amountOutMid: bigint
    amountOutBid: bigint
    amountOutAsk: bigint
  }>
  oracleInfo: {
    oracle: Address
    name: string
    oracleInfo: `0x${string}`
  }
  backupAssetPriceInfo: {
    queryFailure: boolean
    queryFailureReason: `0x${string}`
    timestamp: bigint
    oracle: Address
    asset: Address
    unitOfAccount: Address
    amountIn: bigint
    amountOutMid: bigint
    amountOutBid: bigint
    amountOutAsk: bigint
  }
  backupAssetOracleInfo: {
    oracle: Address
    name: string
    oracleInfo: `0x${string}`
  }
}

function transformVaultLensData(raw: VaultLensRawResult): Partial<VaultInfo> {
  const totalAssets = raw.totalAssets
  const totalBorrows = raw.totalBorrowed
  const cash = raw.totalCash
  
  const utilization = totalAssets > 0n 
    ? Number((totalBorrows * 10000n) / totalAssets) / 10000 
    : 0

  const collateralLTVs: LTVInfo[] = raw.collateralLTVInfo.map(ltv => ({
    collateral: ltv.collateral,
    borrowLTV: ltv.borrowLTV,
    liquidationLTV: ltv.liquidationLTV,
    initialLiquidationLTV: ltv.initialLiquidationLTV,
    targetTimestamp: ltv.targetTimestamp,
    rampDuration: ltv.rampDuration,
  }))

  const interestRateInfo: InterestRateInfo[] | null = raw.irmInfo.queryFailure 
    ? null 
    : raw.irmInfo.interestRateInfo.map(info => ({
        cash: info.cash,
        borrows: info.borrows,
        borrowSPY: info.borrowSPY,
        borrowAPY: info.borrowAPY,
        supplyAPY: info.supplyAPY,
      }))

  const interestRateModelInfo: InterestRateModelInfo | null = raw.irmInfo.queryFailure
    ? null
    : {
        interestRateModel: raw.irmInfo.interestRateModelInfo.interestRateModel,
        interestRateModelType: raw.irmInfo.interestRateModelInfo.interestRateModelType,
        interestRateModelParams: raw.irmInfo.interestRateModelInfo.interestRateModelParams,
      }

  let assetPrice: number | null = null
  if (!raw.liabilityPriceInfo.queryFailure && raw.liabilityPriceInfo.amountOutMid > 0n) {
    const uoaDecimals = Number(raw.unitOfAccountDecimals)
    assetPrice = Number(raw.liabilityPriceInfo.amountOutMid) / Math.pow(10, uoaDecimals)
  }

  const supplyAPYRaw = interestRateInfo?.[0]?.supplyAPY
  const borrowAPYRaw = interestRateInfo?.[0]?.borrowAPY
  const supplyAPY = supplyAPYRaw !== undefined ? Number(supplyAPYRaw) / 1e27 : 0
  const borrowAPY = borrowAPYRaw !== undefined ? Number(borrowAPYRaw) / 1e27 : 0

  return {
    vault: raw.vault,
    vaultName: raw.vaultName,
    vaultSymbol: raw.vaultSymbol,
    vaultDecimals: Number(raw.vaultDecimals),
    asset: raw.asset,
    assetName: raw.assetName,
    assetSymbol: raw.assetSymbol,
    assetDecimals: Number(raw.assetDecimals),
    
    assetPrice,
    assetPriceTimestamp: null,
    
    totalAssets,
    totalAssetsUSD: null,
    totalBorrows,
    totalBorrowsUSD: null,
    cash,
    cashUSD: null,
    totalShares: raw.totalShares,
    utilization,
    
    supplyAPY,
    borrowAPY,
    totalAPY: null,
    rewardAPY: null,
    baseAPY: supplyAPY,
    
    supplyCap: raw.supplyCap,
    borrowCap: raw.borrowCap,
    supplyCapPercentage: null,
    
    collateralLTVs,
    exposure: null,
    
    products: null,
    entities: null,
    rewardsMetadata: null,
    governorType: null,
    governorAdmin: raw.governorAdmin,
    
    interestRateModel: raw.interestRateModel,
    interestRateInfo,
    interestRateModelInfo,
    interestFee: raw.interestFee,
    
    protocolFeeShare: raw.protocolFeeShare,
    governorFeeReceiver: raw.governorFeeReceiver,
    protocolFeeReceiver: raw.protocolFeeReceiver,
    accumulatedFeesShares: raw.accumulatedFeesShares,
    accumulatedFeesAssets: raw.accumulatedFeesAssets,
    
    maxLiquidationDiscount: raw.maxLiquidationDiscount,
    liquidationCoolOffTime: raw.liquidationCoolOffTime,
    
    hookTarget: raw.hookTarget,
    hookedOperations: raw.hookedOperations,
    configFlags: raw.configFlags,
    
    oracle: raw.oracle,
    unitOfAccount: raw.unitOfAccount,
    unitOfAccountName: raw.unitOfAccountName,
    unitOfAccountSymbol: raw.unitOfAccountSymbol,
    unitOfAccountDecimals: Number(raw.unitOfAccountDecimals),
  }
}

export function useVaultLensData({
  vaultAddress,
  enabled = true,
}: UseVaultLensDataParams): UseVaultLensDataResult {
  const config = useVaultConfig()
  
  const hasVaultLens = !!config.vaultLensAddress

  const query = useReadContract({
    address: config.vaultLensAddress,
    abi: vaultLensAbi,
    functionName: 'getVaultInfoFull',
    args: [vaultAddress],
    chainId: config.chainId,
    query: {
      enabled: enabled && hasVaultLens && !!vaultAddress,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  })

  const transformedData = query.data 
    ? transformVaultLensData(query.data as unknown as VaultLensRawResult)
    : undefined

  return {
    data: transformedData,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
