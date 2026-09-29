import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateInventoryStatus,
  ensurePositiveQuantity,
  validateNewStockValue,
} from '../src/services/inventory.service.js';

test('calculateInventoryStatus marks items as out of stock when stock is zero', () => {
  assert.equal(calculateInventoryStatus(0, 5), 'OUT_OF_STOCK');
});

test('calculateInventoryStatus marks items as low stock when stock is at or below minimum', () => {
  assert.equal(calculateInventoryStatus(4, 5), 'LOW_STOCK');
  assert.equal(calculateInventoryStatus(5, 5), 'LOW_STOCK');
});

test('ensurePositiveQuantity rejects invalid stock movement quantities', () => {
  assert.throws(() => ensurePositiveQuantity(0), /positive/);
  assert.throws(() => ensurePositiveQuantity(-1), /positive/);
});

test('validateNewStockValue rejects negative inventory values', () => {
  assert.throws(() => validateNewStockValue(-1), /non-negative/);
  assert.doesNotThrow(() => validateNewStockValue(12));
});
