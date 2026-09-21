// A bill is a snapshot of the existing cart and verified menu at click time.
export function getCartItems(cart, items) {
  return cart.map(row => {
    const item = items.get(row.id);
    return {
      id: row.id,
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

function writeUint16(target, value) {
  target.push((value >>> 8) & 255, value & 255);
}

function writeUint32(target, value) {
  target.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
}

function writeVarint(target, value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid compact integer');
  while (value >= 128) {
    target.push((value % 128) | 128);
    value = Math.floor(value / 128);
  }
  target.push(value);
}

function writeString(target, value) {
  const bytes = new TextEncoder().encode(value);
  writeVarint(target, bytes.length);
  target.push(...bytes);
}

function checksum32(bytes) {
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash;
}

class ByteReader {
  constructor(bytes) { this.bytes = bytes; this.offset = 0; }
  byte() {
    if (this.offset >= this.bytes.length) throw new Error('Truncated compact bill');
    return this.bytes[this.offset++];
  }
  uint16() { return this.byte() * 256 + this.byte(); }
  uint32() { return (this.byte() * 0x1000000 + this.byte() * 0x10000 + this.byte() * 0x100 + this.byte()) >>> 0; }
  varint(max = Number.MAX_SAFE_INTEGER) {
    let value = 0;
    let factor = 1;
    for (let index = 0; index < 5; index++) {
      const byte = this.byte();
      value += (byte & 127) * factor;
      if (!(byte & 128)) {
        if (!Number.isSafeInteger(value) || value > max) throw new Error('Compact integer exceeds limit');
        return value;
      }
      factor *= 128;
    }
    throw new Error('Invalid compact integer');
  }
  string(maxBytes) {
    const length = this.varint(maxBytes);
    if (this.offset + length > this.bytes.length) throw new Error('Truncated compact string');
    const value = new TextDecoder('utf-8', {fatal:true}).decode(this.bytes.subarray(this.offset, this.offset + length));
    this.offset += length;
    return value;
  }
}

function encodeBill3(snapshot) {
  const details = snapshot?.details;
  const customer = snapshot?.customer;
  const number = /^ORD-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-(\d{3})$/.exec(details?.number || '');
  const pickupDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(customer?.date || '');
  const pickupTime = /^(\d{2}):(\d{2})$/.exec(customer?.time || '');
  if (!number || !customer || !Array.isArray(snapshot.rows) || snapshot.rows.some(row => typeof row.id !== 'string' || !row.id)) return null;
  if ((customer.date && !pickupDate) || (customer.time && !pickupTime)) return null;

  const output = [3];
  writeUint16(output, Number(number[1]));
  output.push(...number.slice(2, 7).map(Number));
  writeUint16(output, Number(number[7]));
  writeVarint(output, snapshot.rows.length);
  for (const row of snapshot.rows) {
    writeString(output, row.id.startsWith('hana-') ? row.id.slice(5) : `!${row.id}`);
    writeVarint(output, row.quantity);
    writeVarint(output, row.unitPriceCents);
  }

  const flags = (pickupDate ? 1 : 0) | (pickupTime ? 2 : 0);
  output.push(flags);
  if (pickupDate) {
    writeUint16(output, Number(pickupDate[1]));
    output.push(Number(pickupDate[2]), Number(pickupDate[3]));
  }
  if (pickupTime) output.push(Number(pickupTime[1]), Number(pickupTime[2]));
  writeString(output, customer.name);
  writeString(output, customer.phone);
  writeString(output, customer.notes);

  const body = Uint8Array.from(output);
  const result = [...body];
  writeUint32(result, checksum32(body));
  return Uint8Array.from(result);
}

function decodeBill3(bytes, items) {
  if (!(items instanceof Map) || bytes.length < 15) return null;
  const body = bytes.subarray(0, -4);
  const checksumReader = new ByteReader(bytes.subarray(-4));
  if (checksumReader.uint32() !== checksum32(body)) return null;
  const reader = new ByteReader(body);
  if (reader.byte() !== 3) return null;

  const year = reader.uint16();
  const month = reader.byte();
  const day = reader.byte();
  const hour = reader.byte();
  const minute = reader.byte();
  const second = reader.byte();
  const milliseconds = reader.uint16();
  const rowCount = reader.varint(200);
  if (!rowCount) return null;
  const rows = [];
  for (let index = 0; index < rowCount; index++) {
    const key = reader.string(100);
    const id = key.startsWith('!') ? key.slice(1) : `hana-${key}`;
    const item = items.get(id);
    if (!item) return null;
    const quantity = reader.varint(99);
    const unitPriceCents = reader.varint(1000000);
    rows.push({
      id,
      number:item.number,
      name:item.name,
      variant:item.variant || '',
      quantityLabel:item.quantityLabel || '',
      quantity,
      unitPriceCents,
      lineTotalCents:unitPriceCents * quantity
    });
  }

  const flags = reader.byte();
  if (flags & ~3) return null;
  let pickupDate = '';
  let pickupTime = '';
  if (flags & 1) pickupDate = `${String(reader.uint16()).padStart(4, '0')}-${String(reader.byte()).padStart(2, '0')}-${String(reader.byte()).padStart(2, '0')}`;
  if (flags & 2) pickupTime = `${String(reader.byte()).padStart(2, '0')}:${String(reader.byte()).padStart(2, '0')}`;
  const customer = {
    date:pickupDate,
    time:pickupTime,
    name:reader.string(400),
    phone:reader.string(120),
    notes:reader.string(4000)
  };
  if (reader.offset !== body.length) return null;

  const pad = (value, length = 2) => String(value).padStart(length, '0');
  return validateSnapshot({
    version:1,
    details:{
      number:`ORD-${pad(year,4)}${pad(month)}${pad(day)}-${pad(hour)}${pad(minute)}${pad(second)}-${pad(milliseconds,3)}`,
      date:`${pad(day)}.${pad(month)}.${pad(year,4)}`,
      time:`${pad(hour)}:${pad(minute)}`
    },
    rows,
    customer
  });
}

export function billPageUrl(currentUrl, publishedUrl) {
  const current = new URL(currentUrl);
  return ['localhost', '127.0.0.1', '[::1]'].includes(current.hostname) ? current.href : publishedUrl;
}

// Keep customer details in the fragment, outside HTTP requests and server logs.
// The compact, compressed format avoids overly long links in chat applications.
export async function createBillLink(snapshot, pageUrl) {
  const url = new URL(pageUrl);
  url.search = '';
  const binary = encodeBill3(snapshot);
  if (binary) {
    url.hash = `b3=${encodeToken(binary)}`;
    return url.toString();
  }
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
  url.hash = `${compressed ? 'bill2' : 'bill'}=${encodeToken(payload)}`;
  return url.toString();
}

function validateSnapshot(snapshot) {
  if (snapshot?.version !== 1 || !Array.isArray(snapshot.rows) || !snapshot.rows.length || snapshot.rows.length > 200) return null;
  if (!snapshot.details || !/^ORD-\d{8}-\d{6}-\d{3}$/.test(snapshot.details.number) ||
      !/^\d{2}\.\d{2}\.\d{4}$/.test(snapshot.details.date) || !/^\d{2}:\d{2}$/.test(snapshot.details.time)) return null;
  if (snapshot.rows.some(row =>
      !row || typeof row !== 'object' ||
    (row.id !== undefined && (typeof row.id !== 'string' || !row.id || row.id.length > 100)) ||
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

export async function readBillLink(hash, items) {
  if (hash.startsWith('#b3=')) {
    const token = hash.slice(4);
    if (!token || token.length > 10000 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
    try { return decodeBill3(decodeToken(token), items); }
    catch { return null; }
  }
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
