import test from 'node:test';
import assert from 'node:assert/strict';
import { reservationSlots, reservationMessage, pickupSlots, validDate } from '../assets/js/core.js';
import { MENU } from '../assets/js/menu.js';
const now=new Date('2026-09-07T10:00:00Z');
test('Reservation slots respect lead time, breaks, duration, holidays and booking horizon',()=>{
 const times=reservationSlots('2026-09-07',now);
 assert.equal(times[0],'12:30');
 assert.ok(times.includes('13:30'));
 assert.ok(!times.includes('13:45'));
 assert.ok(!times.includes('16:00'));
 assert.equal(times.at(-1),'21:00');
 assert.ok(reservationSlots('2026-10-03',now).includes('16:00'));
 assert.deepEqual(reservationSlots('2026-09-06',now),[]);
 assert.deepEqual(reservationSlots('2027-01-01',now),[]);
 assert.deepEqual(reservationSlots('2026-09-07',new Date('2026-09-07T19:00:00Z')),[]);
});
test('Impossible calendar dates cannot produce pickup or booking times',()=>{
 for(const date of ['2026-02-30','2026-09-31','2026-13-01','invalid','']) {
  assert.equal(validDate(date),false);assert.deepEqual(pickupSlots(date,now),[]);assert.deepEqual(reservationSlots(date,now),[]);
 }
 assert.equal(validDate('2028-02-29'),true);
});
test('Reservation payload preserves guests, contact and wishes',()=>{
 const message=reservationMessage({guests:'4',date:'2026-09-08',time:'18:30',name:'Gast',phone:'123456',email:'test@example.com',notes:'Kinderstuhl'});
 for(const value of ['Personen: 4','18:30 Uhr','test@example.com','Kinderstuhl'])assert.ok(message.includes(value));
});
test('Current menu price tiers and sets retain exact euro cents and unique identifiers',()=>{
 const items=MENU.categories.flatMap(c=>c.items);const lookup=new Map(items.map(i=>[i.number,i]));
 assert.equal(items.length,174);assert.equal(new Set(items.map(i=>i.id)).size,174);
 assert.equal(MENU.source,'MENU.pdf');assert.equal(MENU.verified,true);
 for(const [number,price] of [['6G',550],['28G',1700],['50G',1600],['70F',1700],['30E',1500],['213',500],['261',650],['286',1450],['289',1300],['291',1450],['314',800],['334',4000],['340',9500],['128',350],['27',500]])assert.equal(lookup.get(number).priceCents,price,number);
 assert.deepEqual(lookup.get('4').allergens,['a']);
 assert.deepEqual(lookup.get('27').allergens,['g']);
 assert.match(lookup.get('314').description,/Gurke und Frischkäse/);
 assert.equal(lookup.get('30A').vegan,false);assert.match(lookup.get('30A').description,/Vegan auf Anfrage/);
 for(const item of items){assert.ok(Number.isInteger(item.priceCents));for(const code of item.allergens)assert.ok(MENU.allergens[code]);}
});
