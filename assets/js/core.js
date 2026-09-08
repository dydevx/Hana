import { OPENING_HOURS, PICKUP_LEAD_MINUTES, RESERVATION_LEAD_MINUTES, RESERVATION_DURATION_MINUTES, RESERVATION_MAX_DAYS } from './config.js';
export const money = cents => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function germanNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(now).map(p=>[p.type,p.value]));
  return { date:`${parts.year}-${parts.month}-${parts.day}`, minutes:Number(parts.hour)*60+Number(parts.minute) };
}
export const minuteOf = time => Number(time.slice(0,2))*60+Number(time.slice(3));
export function easter(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),n=h+l-7*m+114;
  return new Date(Date.UTC(year,Math.floor(n/31)-1,n%31+1,12));
}
// Olsberg is in North Rhine-Westphalia. Includes state public holidays.
export function isHoliday(date) {
  if (['01-01','05-01','10-03','11-01','12-25','12-26'].includes(date.slice(5))) return true;
  const e=easter(Number(date.slice(0,4)));
  return [-2,1,39,50,60].some(offset=>new Date(e.getTime()+offset*86400000).toISOString().slice(0,10)===date);
}
export function hoursFor(date) {
  const day=new Date(`${date}T12:00:00Z`).getUTCDay();
  return (day===0 || day===6 || isHoliday(date)) ? OPENING_HOURS.weekend : OPENING_HOURS.weekday;
}
export function isOpen(now = new Date()) {
  const current=germanNow(now);
  return hoursFor(current.date).some(([a,b])=>current.minutes>=minuteOf(a)&&current.minutes<minuteOf(b));
}
export function pickupSlots(date, now = new Date()) {
  const current=germanNow(now);
  if (!validDate(date) || date<current.date) return [];
  return hoursFor(date).flatMap(([start,end])=>{
    const slots=[];
    for(let m=minuteOf(start);m<minuteOf(end);m+=15) {
      if(date===current.date && m<current.minutes+PICKUP_LEAD_MINUTES) continue;
      slots.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
    }
    return slots;
  });
}
export function validDate(date) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
 const value = new Date(`${date}T12:00:00Z`);
 return !Number.isNaN(value.getTime()) && value.toISOString().slice(0,10) === date;
}
export const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0,10);
export function reservationSlots(date, now = new Date()) {
 const current = germanNow(now);
 if (!validDate(date) || date < current.date || date > addDays(current.date, RESERVATION_MAX_DAYS)) return [];
 return hoursFor(date).flatMap(([start,end]) => {
  const slots=[];
  for(let m=minuteOf(start);m<=minuteOf(end)-RESERVATION_DURATION_MINUTES;m+=15) {
   if(date===current.date && m<current.minutes+RESERVATION_LEAD_MINUTES) continue;
   slots.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
  }
  return slots;
 });
}
export function reservationMessage(data) {
 return ['Tischreservierung – HANA Japanisches Restaurant','',`Personen: ${data.guests}`,`Datum: ${data.date}`,`Uhrzeit: ${data.time} Uhr`,'',`Name: ${data.name}`,`Telefon: ${data.phone}`,`E-Mail: ${data.email || '–'}`,'',`Wünsche: ${data.notes || '–'}`,'','Bitte bestätigen Sie unsere Reservierungsanfrage.'].join('\n');
}
export function sanitizeCart(raw, items) {
  if (!Array.isArray(raw)) return [];
  const result=new Map();
  for(const row of raw) if(row && items.has(row.id) && Number.isInteger(row.quantity) && row.quantity>0) result.set(row.id,Math.min(99,(result.get(row.id)||0)+row.quantity));
  return [...result].map(([id,quantity])=>({id,quantity}));
}
export const cartTotal = (cart, items) => cart.reduce((sum,row)=>sum+items.get(row.id).priceCents*row.quantity,0);
export function orderMessage(data, cart, items) {
  return ['Neue Bestellung – HANA Japanisches Restaurant', '', `Name: ${data.name}`, `Telefon: ${data.phone}`, `E-Mail: ${data.email||'–'}`, `Abholdatum: ${data.date}`, `Abholzeit: ${data.time} Uhr`, '', 'Bestellung:', ...cart.map(row=>{const i=items.get(row.id);return `${i.number}. ${i.name}${i.variant?' ('+i.variant+')':''}${i.quantityLabel?' · '+i.quantityLabel:''} × ${row.quantity} – ${money(i.priceCents*row.quantity)}`;}),'',`Gesamt: ${money(cartTotal(cart,items))}`,'Zahlung bei Abholung','',`Hinweis: ${data.notes||'–'}`].join('\n');
}
