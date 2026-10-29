// SPDX-License-Identifier: Apache-2.0

import { Helper } from '../../../src/utils/helper';

describe('Helper', () => {
  describe('buildUrl', () => {
    const mockNext =
      '/api/v1/contracts?limit=100&order=asc&contract.id=gt:0.0.5294198';
    const mockScanningLimit = 39;

    it('Should build a default next url', () => {
      const expectedDefaultNext = '/api/v1/contracts?limit=100&order=asc';
      const defaultNext = Helper.buildUrl(null);
      expect(defaultNext).toEqual(expectedDefaultNext);
    });

    it('Should return next link if provided', () => {
      const nextLink = Helper.buildUrl(mockNext);
      expect(nextLink).toEqual(mockNext);
    });

    it('Should return next link modified with scanningLimit if provided', () => {
      const expectedNextLink = mockNext.replace(
        '100',
        mockScanningLimit.toString()
      );

      const nextLink = Helper.buildUrl(mockNext, mockScanningLimit);
      expect(nextLink).toEqual(expectedNextLink);
    });
  });
});
