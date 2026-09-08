import { germanNow, addDays, reservationSlots, reservationMessage } from './core.js';
import { EMAIL_ADDRESS, RESERVATION_MAX_DAYS } from './config.js';

export function initReservation() {
 const form=document.querySelector('#reservation-form');
 const review=document.querySelector('#reservation-review');
 const error=document.querySelector('#reservation-error');
 const send=document.querySelector('#send-reservation');
 const steps=[...document.querySelectorAll('.booking-progress li')];
 let message='';
 function slots() {
  const times=reservationSlots(form.elements.date.value);
  const previous=form.elements.time.value;
  form.elements.time.replaceChildren(new Option(times.length?'Bitte wählen':'Keine Uhrzeit verfügbar',''),...times.map(t=>new Option(`${t} Uhr`,t)));
  if(times.includes(previous))form.elements.time.value=previous;
  document.querySelector('#reservation-time-help').textContent=times.length?'Wunschzeiten innerhalb unserer Öffnungszeiten. HANA bestätigt die Verfügbarkeit.':'Für diesen Tag sind keine Wunschzeiten mehr verfügbar. Bitte wählen Sie einen anderen Tag.';
 }
 function edit() {
  form.hidden=false;review.hidden=true;steps[0].setAttribute('aria-current','step');steps[1].removeAttribute('aria-current');
 }
 form.hidden=false;
 const today=germanNow().date;
 form.elements.date.min=today;form.elements.date.max=addDays(today,RESERVATION_MAX_DAYS);
 form.elements.date.value=reservationSlots(today).length?today:addDays(today,1);
 slots();
 form.elements.date.addEventListener('change',()=>{error.textContent='';slots();});
 form.addEventListener('submit',event=>{
  event.preventDefault();error.textContent='';
  const data=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
  if(data.name.length<2 || !/^[+\d() /-]{6,30}$/.test(data.phone)) {error.textContent='Bitte geben Sie Ihren vollständigen Namen und eine gültige Telefonnummer ein.';return;}
  if(!Number.isInteger(Number(data.guests)) || Number(data.guests)<1 || Number(data.guests)>12) {error.textContent='Bitte wählen Sie zwischen 1 und 12 Personen.';return;}
  if(!reservationSlots(data.date).includes(data.time)) {error.textContent='Bitte wählen Sie eine verfügbare Wunschzeit.';slots();form.elements.time.focus();return;}
  message=reservationMessage(data);
  document.querySelector('#reservation-message').textContent=message;
  document.querySelector('#reservation-copy-status').textContent='';
  send.href=`mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent('Tischreservierung – HANA')}&body=${encodeURIComponent(message)}`;
  form.hidden=true;review.hidden=false;steps[0].removeAttribute('aria-current');steps[1].setAttribute('aria-current','step');
  document.querySelector('#reservation-review-title').focus({preventScroll:true});
  document.querySelector('#reservation-booking').scrollIntoView({block:'start',behavior:'instant'});
 });
 send.addEventListener('click',event=>{
  if(!reservationSlots(form.elements.date.value).includes(form.elements.time.value)) {
   event.preventDefault();edit();slots();error.textContent='Die Wunschzeit ist inzwischen abgelaufen. Bitte wählen Sie eine neue Zeit.';form.elements.time.focus();
  }
 });
 document.querySelector('#edit-reservation').addEventListener('click',()=>{edit();slots();form.elements.guests.focus();});
 document.querySelector('#copy-reservation').addEventListener('click',async()=>{
  const status=document.querySelector('#reservation-copy-status');
  try {await navigator.clipboard.writeText(message);status.textContent='Anfrage kopiert. Sie können sie in Ihre E-Mail einfügen.';}
  catch {const range=document.createRange();range.selectNodeContents(document.querySelector('#reservation-message'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Bitte kopieren Sie den markierten Text.';}
 });
}
