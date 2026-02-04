import type { OracleConfig } from './types'

export function createOracleConfig(config: OracleConfig): OracleConfig {
  if (typeof config.chainId !== 'number') {
    throw new Error('createOracleConfig: chainId is required and must be a number')
  }

  if (!config.routerAddress) {
    throw new Error('createOracleConfig: routerAddress is required')
  }

  if (!config.usdUnitOfAccount) {
    throw new Error('createOracleConfig: usdUnitOfAccount is required')
  }

  if (!config.usdReferenceToken) {
    throw new Error('createOracleConfig: usdReferenceToken is required')
  }

  return {
    chainId: config.chainId,
    routerAddress: config.routerAddress,
    usdUnitOfAccount: config.usdUnitOfAccount,
    usdReferenceToken: config.usdReferenceToken,
  }
}
