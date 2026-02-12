import { http, HttpResponse } from 'msw'

// Test data
export const MOCK_CHAIN_ID = 999

export const MOCK_VAULT_ADDRESS = '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b'
export const MOCK_EARN_VAULT_ADDRESS = '0xABCDEF1234567890123456789012345678901234'
export const MOCK_ASSET_ADDRESS = '0x1234567890123456789012345678901234567890'

// Fresh timestamp (5 minutes ago)
const FRESH_TIMESTAMP = new Date(Date.now() - 5 * 60 * 1000).toISOString()

// Stale timestamp (20 minutes ago - beyond 15 min threshold)
const STALE_TIMESTAMP = new Date(Date.now() - 20 * 60 * 1000).toISOString()

export const mockVaultData = {
  items: [
    {
      vault: MOCK_VAULT_ADDRESS,
      vaultName: 'Test Vault',
      vaultSymbol: 'eTST',
      vaultDecimals: 18,
      asset: MOCK_ASSET_ADDRESS,
      assetName: 'Test Asset',
      assetSymbol: 'TST',
      assetDecimals: 18,
      assetPrice: 100.5,
      assetPriceTimestamp: FRESH_TIMESTAMP,
      totalAssets: '1000000000000000000000',
      totalAssetsUSD: 100500,
      totalBorrows: '500000000000000000000',
      cash: '500000000000000000000',
      cashUSD: 50250,
      totalShares: '1000000000000000000000',
      utilization: 0.5,
      baseApy: 3.5,
      intrinsicApy: { apy: 2.16, provider: 'kHYPE' },
      rewardApy: 0.5,
      totalApy: 6.16,
      supplyCap: '10000000000000000000000',
      borrowCap: '5000000000000000000000',
      perspectives: ['0x1111111111111111111111111111111111111111'],
    },
  ],
  pagination: {
    page: 1,
    limit: 100,
    total: 1,
  },
}

export const mockStaleVaultData = {
  items: [
    {
      ...mockVaultData.items[0],
      assetPriceTimestamp: STALE_TIMESTAMP,
    },
  ],
  pagination: mockVaultData.pagination,
}

export const mockEarnVaultListData = {
  items: [
    { vault: MOCK_EARN_VAULT_ADDRESS },
  ],
  pagination: {
    skip: 0,
    take: 100,
    total: 1,
  },
}

export const mockEarnVaultDetailData = {
  vault: {
    vault: MOCK_EARN_VAULT_ADDRESS,
    vaultName: 'Test Earn Vault',
    vaultSymbol: 'eeVault',
    vaultDecimals: 18,
    asset: MOCK_ASSET_ADDRESS,
    assetName: 'Test Asset',
    assetSymbol: 'TST',
    assetDecimals: 18,
    totalShares: '1000000000000000000',
    totalAssets: '1000000000000000000',
    totalAssetsUSD: 100,
    availableAssets: '500000000000000000',
    availableAssetsUSD: 50,
    lostAssets: '0',
    performanceFee: '100000000000000000',
    feeReceiver: '0x0000000000000000000000000000000000000001',
    timelock: '86400',
    owner: '0x0000000000000000000000000000000000000002',
    creator: '0x0000000000000000000000000000000000000003',
    curator: '0x0000000000000000000000000000000000000004',
    guardian: '0x0000000000000000000000000000000000000005',
    evc: '0x0000000000000000000000000000000000000006',
    permit2: '0x0000000000000000000000000000000000000007',
    supplyQueue: [],
    strategies: [
      {
        strategy: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        strategyVaultName: 'Test Strategy',
        strategyVaultSymbol: 'STR',
        allocatedAssets: '500000000000000000',
        allocatedAssetsUSD: 50,
        availableAssets: '250000000000000000',
        currentAllocationCap: '1000000000000000000',
        pendingAllocationCap: '0',
        pendingAllocationCapValidAt: '0',
        removableAt: '0',
        status: 'active',
      },
    ],
    apy7d: 5.25,
    apy30d: 4.8,
    apy90d: 6.1,
    apyCurrent: 5.5,
    timestamp: FRESH_TIMESTAMP,
  },
}

// Request tracking for assertions
export const requestTracker = {
  vaultListCalls: 0,
  earnVaultListCalls: 0,
  earnVaultDetailCalls: 0,
  reset() {
    this.vaultListCalls = 0
    this.earnVaultListCalls = 0
    this.earnVaultDetailCalls = 0
  },
}

export const handlers = [
  // Vault list endpoint (v2)
  http.post('https://indexer-test.example.com/v2/vault/list', async ({ request }) => {
    requestTracker.vaultListCalls++
    const url = new URL(request.url)
    const chainId = url.searchParams.get('chainId')

    if (chainId !== String(MOCK_CHAIN_ID)) {
      return HttpResponse.json({ items: [], pagination: { page: 1, limit: 100, total: 0 } })
    }

    return HttpResponse.json(mockVaultData)
  }),

  // Earn vault list endpoint
  http.get('https://indexer-test.example.com/v1/earn/vaults', ({ request }) => {
    requestTracker.earnVaultListCalls++
    const url = new URL(request.url)
    const chainId = url.searchParams.get('chainId')

    if (chainId !== String(MOCK_CHAIN_ID)) {
      return HttpResponse.json({ items: [], pagination: { skip: 0, take: 100, total: 0 } })
    }

    return HttpResponse.json(mockEarnVaultListData)
  }),

  // Earn vault detail endpoint
  http.get('https://indexer-test.example.com/v1/earn/vault', ({ request }) => {
    requestTracker.earnVaultDetailCalls++
    const url = new URL(request.url)
    const vaultAddress = url.searchParams.get('vaultAddress')

    if (vaultAddress?.toLowerCase() !== MOCK_EARN_VAULT_ADDRESS.toLowerCase()) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json(mockEarnVaultDetailData)
  }),
]

// Handler variants for error scenarios
export const errorHandlers = {
  vaultList500: http.post('https://indexer-test.example.com/v2/vault/list', () => {
    return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
  }),

  earnVaultList500: http.get('https://indexer-test.example.com/v1/earn/vaults', () => {
    return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' })
  }),

  earnVaultDetail404: http.get('https://indexer-test.example.com/v1/earn/vault', () => {
    return new HttpResponse(null, { status: 404, statusText: 'Not Found' })
  }),

  staleVaultData: http.post('https://indexer-test.example.com/v2/vault/list', () => {
    return HttpResponse.json(mockStaleVaultData)
  }),
}
