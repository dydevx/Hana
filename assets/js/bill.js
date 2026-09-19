// A bill is a snapshot of the existing cart and verified menu at click time.
export function getCartItems(cart, items) {
  return cart.map(row => {
    const item = items.get(row.id);
    return {
      number: item.number,
      name: item.name,
      variant: item.variant || '',
      quantityLabel: item.quantityLabel || '',
      quantity: row.quantity,
      unitPriceCents: item.priceCents,
      lineTotalCents: item.priceCents * row.quantity
    };
  });
}

export function calculateBill(rows) {
  const subtotalCents = rows.reduce((sum, row) => sum + row.lineTotalCents, 0);
  return { rows, subtotalCents, totalCents: subtotalCents };
}

export function billDetails(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).map(part => [part.type, part.value]));
  const { year, month, day, hour, minute, second } = parts;
  return {
    number: `ORD-${year}${month}${day}-${hour}${minute}${second}-${String(now.getMilliseconds()).padStart(3, '0')}`,
    date: `${day}.${month}.${year}`,
    time: `${hour}:${minute}`
  };
}

// The hash stays out of the HTTP request. The email carries the complete order
// snapshot so the restaurant can open it on a device with an empty cart.
export function createBillLink(snapshot, pageUrl) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const token = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL(pageUrl);
  url.search = '';
  url.hash = `bill=${token}`;
  return url.toString();
}

export function readBillLink(hash) {
  if (!hash.startsWith('#bill=')) return null;
  const token = hash.slice(6);
  if (!token || token.length > 50000 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - token.length % 4) % 4));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const snapshot = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
    if (snapshot?.version !== 1 || !Array.isArray(snapshot.rows) || !snapshot.rows.length || snapshot.rows.length > 200) return null;
    if (!snapshot.details || !/^ORD-\d{8}-\d{6}-\d{3}$/.test(snapshot.details.number) ||
        !/^\d{2}\.\d{2}\.\d{4}$/.test(snapshot.details.date) || !/^\d{2}:\d{2}$/.test(snapshot.details.time)) return null;
    if (snapshot.rows.some(row =>
      typeof row.number !== 'string' || row.number.length > 20 ||
      typeof row.name !== 'string' || !row.name || row.name.length > 200 ||
      typeof row.variant !== 'string' || row.variant.length > 200 ||
      typeof row.quantityLabel !== 'string' || row.quantityLabel.length > 100 ||
      !Number.isInteger(row.quantity) || row.quantity < 1 || row.quantity > 99 ||
      !Number.isSafeInteger(row.unitPriceCents) || row.unitPriceCents < 0 || row.unitPriceCents > 1000000 ||
      row.lineTotalCents !== row.unitPriceCents * row.quantity
    )) return null;
    const customer = snapshot.customer;
    if (!customer || Object.entries({name:100, phone:30, date:10, time:5, notes:1000}).some(([key,max]) =>
      typeof customer[key] !== 'string' || customer[key].length > max)) return null;
    return snapshot;
  } catch {
    return null;
  }
}
