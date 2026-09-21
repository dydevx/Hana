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

function encodeToken(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeToken(token) {
  const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - token.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

// Keep customer details in the fragment, outside HTTP requests and server logs.
// The compact, compressed format avoids overly long links in chat applications.
export async function createBillLink(snapshot, pageUrl) {
  const compact = [
    [snapshot.details.number, snapshot.details.date, snapshot.details.time],
    snapshot.rows.map(row => [row.number, row.name, row.variant, row.quantityLabel, row.quantity, row.unitPriceCents]),
    [snapshot.customer.name, snapshot.customer.phone, snapshot.customer.date, snapshot.customer.time, snapshot.customer.notes]
  ];
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  const compressed = typeof CompressionStream === 'function';
  const payload = compressed
    ? new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())
    : new TextEncoder().encode(JSON.stringify(snapshot));
  const url = new URL(pageUrl);
  url.search = '';
  url.hash = `${compressed ? 'bill2' : 'bill'}=${encodeToken(payload)}`;
  return url.toString();
}

function validateSnapshot(snapshot) {
  if (snapshot?.version !== 1 || !Array.isArray(snapshot.rows) || !snapshot.rows.length || snapshot.rows.length > 200) return null;
  if (!snapshot.details || !/^ORD-\d{8}-\d{6}-\d{3}$/.test(snapshot.details.number) ||
      !/^\d{2}\.\d{2}\.\d{4}$/.test(snapshot.details.date) || !/^\d{2}:\d{2}$/.test(snapshot.details.time)) return null;
  if (snapshot.rows.some(row =>
    !row || typeof row !== 'object' ||
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
}

export async function readBillLink(hash) {
  const compact = hash.startsWith('#bill2=');
  if (!compact && !hash.startsWith('#bill=')) return null;
  const token = hash.slice(compact ? 7 : 6);
  if (!token || token.length > 50000 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    let bytes = decodeToken(token);
    if (compact) {
      const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
      const chunks = [];
      let length = 0;
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 50000) { await reader.cancel(); return null; }
        chunks.push(value);
      }
      bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    }
    const data = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
    if (!compact) return validateSnapshot(data);
    if (!Array.isArray(data) || data.length !== 3 || !Array.isArray(data[0]) || data[0].length !== 3 ||
        !Array.isArray(data[1]) || !Array.isArray(data[2]) || data[2].length !== 5 ||
        data[1].some(row => !Array.isArray(row) || row.length !== 6)) return null;
    const [details, rows, customer] = data;
    return validateSnapshot({
      version:1,
      details:{number:details[0],date:details[1],time:details[2]},
      rows:rows.map(([number,name,variant,quantityLabel,quantity,unitPriceCents]) => ({
        number,name,variant,quantityLabel,quantity,unitPriceCents,lineTotalCents:quantity * unitPriceCents
      })),
      customer:{name:customer[0],phone:customer[1],date:customer[2],time:customer[3],notes:customer[4]}
    });
  } catch {
    return null;
  }
}

// Previously shared, uncompressed links remain supported by readBillLink.
export function createLegacyBillLink(snapshot, pageUrl) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const url = new URL(pageUrl);
  url.search = '';
  url.hash = `bill=${encodeToken(bytes)}`;
  return url.toString();
}
