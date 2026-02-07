import { describe, expect, it } from 'vitest'
import type { Address } from 'viem'
import type { ProductsConfig } from '../types/products'
import {
  getProductVaults,
  isVaultInProduct,
  getProductForVault,
  filterVaultsByProduct,
} from '../types/products'

const MOCK_PRODUCTS: ProductsConfig = {
  'hypurrfi-earn': {
    name: 'HypurrFi Earn',
    description: 'Earn vaults curated by Clearstar for HypurrFi on HyperEVM.',
    entity: ['clearstar'],
    url: 'https://hypurr.fi/',
    vaults: [
      '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address,
      '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4' as Address,
    ],
  },
  'hypurrfi-prime': {
    name: 'HypurrFi Prime',
    description: 'Fully cross-collateralized cluster for highly liquid assets.',
    entity: ['clearstar'],
    url: 'https://hypurr.fi/',
    vaults: [
      '0xF73c654d468f5485bF15F3470B78851a49257704' as Address,
      '0x443100d1149D6d925Edb044248BBE32c5C7Ae955' as Address,
    ],
  },
  'hypurrfi-yield': {
    name: 'HypurrFi Yield',
    description: 'Yield-bearing HYPE leverage strategies.',
    entity: ['clearstar'],
    url: 'https://hypurr.fi/',
    vaults: [
      '0xc7e7861352df6919e7152C007832C48A777f2a4c' as Address,
    ],
  },
}

describe('Product utilities', () => {
  describe('getProductVaults', () => {
    it('should return vault addresses for a product', () => {
      const vaults = getProductVaults(MOCK_PRODUCTS, 'hypurrfi-earn')
      expect(vaults).toHaveLength(2)
      expect(vaults).toContain('0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b')
      expect(vaults).toContain('0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4')
    })

    it('should return empty array for unknown product', () => {
      const vaults = getProductVaults(MOCK_PRODUCTS, 'unknown-product' as any)
      expect(vaults).toEqual([])
    })
  })

  describe('isVaultInProduct', () => {
    it('should return true when vault is in product', () => {
      const result = isVaultInProduct(
        MOCK_PRODUCTS,
        '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address,
        'hypurrfi-earn',
      )
      expect(result).toBe(true)
    })

    it('should return true with case-insensitive address comparison', () => {
      const result = isVaultInProduct(
        MOCK_PRODUCTS,
        '0xf38ea9de758a8f6be08b6e65bc0ff2f3e3ab741b' as Address,
        'hypurrfi-earn',
      )
      expect(result).toBe(true)
    })

    it('should return false when vault is not in product', () => {
      const result = isVaultInProduct(
        MOCK_PRODUCTS,
        '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address,
        'hypurrfi-prime',
      )
      expect(result).toBe(false)
    })

    it('should return false for invalid address', () => {
      const result = isVaultInProduct(
        MOCK_PRODUCTS,
        'invalid-address' as Address,
        'hypurrfi-earn',
      )
      expect(result).toBe(false)
    })
  })

  describe('getProductForVault', () => {
    it('should return product ID for vault in Earn', () => {
      const productId = getProductForVault(
        MOCK_PRODUCTS,
        '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address,
      )
      expect(productId).toBe('hypurrfi-earn')
    })

    it('should return product ID for vault in Prime', () => {
      const productId = getProductForVault(
        MOCK_PRODUCTS,
        '0xF73c654d468f5485bF15F3470B78851a49257704' as Address,
      )
      expect(productId).toBe('hypurrfi-prime')
    })

    it('should return null for vault not in any product', () => {
      const productId = getProductForVault(
        MOCK_PRODUCTS,
        '0x0000000000000000000000000000000000000001' as Address,
      )
      expect(productId).toBeNull()
    })
  })

  describe('filterVaultsByProduct', () => {
    it('should filter vaults to only include those in product', () => {
      const allVaults: Address[] = [
        '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
        '0xF73c654d468f5485bF15F3470B78851a49257704',
        '0x0000000000000000000000000000000000000001',
      ] as Address[]

      const filtered = filterVaultsByProduct(MOCK_PRODUCTS, allVaults, 'hypurrfi-earn')
      expect(filtered).toHaveLength(1)
      expect(filtered[0]).toBe('0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b')
    })

    it('should return empty array when no vaults match', () => {
      const vaults: Address[] = ['0x0000000000000000000000000000000000000001'] as Address[]
      const filtered = filterVaultsByProduct(MOCK_PRODUCTS, vaults, 'hypurrfi-earn')
      expect(filtered).toEqual([])
    })
  })

  // REGRESSION TESTS for bug fixes
  describe('regression tests', () => {
    // Bug fix: Yield vaults showed 3 instead of 12 in UI
    // This was due to hardcoded incomplete vault list in stories
    // This test ensures product config is used correctly
    const REAL_PRODUCTS: ProductsConfig = {
      'hypurrfi-earn': {
        name: 'HypurrFi Earn',
        description: 'Earn vaults',
        entity: ['clearstar'],
        url: 'https://hypurr.fi/',
        vaults: [
          '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b',
          '0xe8b10461ea0b04FF30F4cBfc3E93957Cac00DEd4',
          '0x6dd448d5cb73DC96788d5BE605DD3C5c83864a36',
          '0xF868A2B30854FE13e26F7AB7a92609cCb6b9c0e1',
        ] as Address[],
      },
      'hypurrfi-prime': {
        name: 'HypurrFi Prime',
        description: 'Prime vaults',
        entity: ['clearstar'],
        url: 'https://hypurr.fi/',
        vaults: [
          '0xF73c654d468f5485bF15F3470B78851a49257704',
          '0x443100d1149D6d925Edb044248BBE32c5C7Ae955',
          '0x8A4545827DF5446Ba120B904e5306e58acCA4E89',
          '0xC200AaB602Cd7046389B5C8FB088884323F8dD0f',
          '0x28fCa2611d1Dd8109c26F748Cd2CF3BB4fC6D2cD',
          '0x83c34784e355ad2670dB77623B845273844FA480',
        ] as Address[],
      },
      'hypurrfi-yield': {
        name: 'HypurrFi Yield',
        description: 'Yield vaults',
        entity: ['clearstar'],
        url: 'https://hypurr.fi/',
        vaults: [
          '0xc7e7861352df6919e7152C007832C48A777f2a4c',
          '0x97d30B40048bA3fC6b6628cE5E02E77f35B64fE0',
          '0x3403176f548400772c39E64564f2b148bcdFb65e',
          '0x64a3052570F5A1c241C6c8cd32F8F9aD411e6990',
          '0x1739105522e4fc9675f857C859223d24DFE7593C',
          '0xcAAA9A6e543b9af588Dce91E6c35Cb5fa1c7734C',
          '0x61Cb3b093b7125D593CCfa135C6e4E9D52D2e697',
          '0x06bf901Ce21450Bab46ceA74C4Bb6F07E6859CD6',
          '0x09a6ad87Eff280755BdF3E2C863358D27d81262D',
          '0x94F5C76A93F12057d73991AE5B4f70e9287b5b28',
          '0xF9BB65e113418292d1a3555515fBd64637a0BE18',
          '0xBb7DC37dbc108d40BcdD60403EF7bFDD6489071E',
        ] as Address[],
      },
    }

    it('should return correct count for Earn vaults (4 vaults)', () => {
      const vaults = getProductVaults(REAL_PRODUCTS, 'hypurrfi-earn')
      expect(vaults).toHaveLength(4)
    })

    it('should return correct count for Prime vaults (6 vaults)', () => {
      const vaults = getProductVaults(REAL_PRODUCTS, 'hypurrfi-prime')
      expect(vaults).toHaveLength(6)
    })

    it('should return correct count for Yield vaults (12 vaults, was bug showing 3)', () => {
      const vaults = getProductVaults(REAL_PRODUCTS, 'hypurrfi-yield')
      // This was the bug - UI was showing only 3 yield vaults
      expect(vaults).toHaveLength(12)
    })

    it('should correctly identify earn vault for earn-specific hook usage', () => {
      // Bug fix: Earn vaults need to use useEarnVaultInfo, not useVaultInfo
      const earnVault = '0xF38eA9DE758a8F6be08B6E65bc0Ff2f3e3aB741b' as Address
      const productId = getProductForVault(REAL_PRODUCTS, earnVault)
      expect(productId).toBe('hypurrfi-earn')

      // Prime vaults should NOT be identified as earn
      const primeVault = '0xF73c654d468f5485bF15F3470B78851a49257704' as Address
      const primeProductId = getProductForVault(REAL_PRODUCTS, primeVault)
      expect(primeProductId).toBe('hypurrfi-prime')
      expect(primeProductId).not.toBe('hypurrfi-earn')
    })
  })
})
