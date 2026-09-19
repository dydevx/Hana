import test from 'node:test';
import assert from 'node:assert/strict';
import { getCartItems, calculateBill, billDetails, createBillLink, readBillLink } from '../assets/js/bill.js';

const items = new Map([
  ['a', {number:'1', name:'Udon', variant:'Garnelen', quantityLabel:'1 Portion', priceCents:1250}],
  ['b', {number:'2', name:'Tee', priceCents:300}]
]);

test('Bill uses existing cart quantities, item options and integer-cent totals', () => {
  const rows = getCartItems([{id:'a', quantity:2}, {id:'b', quantity:1}], items);
  assert.deepEqual(rows.map(row => row.lineTotalCents), [2500, 300]);
  assert.equal(rows[0].variant, 'Garnelen');
  assert.equal(rows[0].quantityLabel, '1 Portion');
  assert.deepEqual(calculateBill(rows), {rows, subtotalCents:2800, totalCents:2800});
  assert.deepEqual(calculateBill([]), {rows:[], subtotalCents:0, totalCents:0});
});

test('Bill date, time and display number use restaurant local time', () => {
  assert.deepEqual(billDetails(new Date('2026-09-19T12:35:01.042Z')), {
    number:'ORD-20260919-143501-042', date:'19.09.2026', time:'14:35'
  });
});

test('Print link carries a Unicode order snapshot and rejects damaged data', () => {
  const snapshot={
    version:1,
    details:billDetails(new Date('2026-09-19T12:35:01.042Z')),
    rows:getCartItems([{id:'a',quantity:2}],items),
    customer:{name:'Nguyễn Müller',phone:'+49 123456',date:'2026-09-20',time:'12:30',notes:'Ohne Zwiebeln'}
  };
  const link=createBillLink(snapshot,'https://example.com/order?tracking=1#speisekarte');
  const url=new URL(link);
  assert.equal(url.search,'');
  assert.deepEqual(readBillLink(url.hash),snapshot);
  assert.equal(readBillLink('#bill=broken'),null);
  assert.equal(readBillLink('#speisekarte'),null);
  const changed={...snapshot,rows:[{...snapshot.rows[0],lineTotalCents:1}]};
  assert.equal(readBillLink(new URL(createBillLink(changed,'https://example.com/')).hash),null);
});
