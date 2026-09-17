import { germanNow, addDays, reservationSlots, reservationMessage } from './core.js';
import { EMAIL_ADDRESS, RESERVATION_MAX_DAYS } from './config.js';
import { emailPlatform, emailComposeLinks } from './email-compose.js';

export function initReservation() {
 const form=document.querySelector('#reservation-form');
 const review=document.querySelector('#reservation-review');
 const error=document.querySelector('#reservation-error');
 const send=document.querySelector('#send-reservation');
 const dialog=document.querySelector('#reservation-email-dialog');
 const gmail=document.querySelector('#reservation-gmail');
 const mail=document.querySelector('#reservation-mail');
 const web=document.querySelector('#reservation-gmail-web');
 const platform=emailPlatform(navigator);
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
  if(dialog.open)dialog.close();
  form.hidden=false;review.hidden=true;steps[0].setAttribute('aria-current','step');steps[1].removeAttribute('aria-current');
 }
 function validTime() {
  if(reservationSlots(form.elements.date.value).includes(form.elements.time.value))return true;
  edit();slots();error.textContent='Die Wunschzeit ist inzwischen abgelaufen. Bitte wählen Sie eine neue Zeit.';form.elements.time.focus();return false;
 }
 function openEmail() {
  if(!validTime())return;
  if(!dialog.open)dialog.showModal();
  // Keep app/web navigation inside the submit or click gesture so browsers allow it.
  (platform==='ios'?mail:gmail).click();
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
  const links=emailComposeLinks(EMAIL_ADDRESS,'Tischreservierung – HANA',message,platform);
  gmail.href=links.gmail;mail.href=links.mail;web.href=links.web;
  gmail.textContent=platform==='desktop'?'Gmail im Browser öffnen ↗':'Gmail-App öffnen ↗';
  mail.textContent=platform==='ios'?'Mail öffnen ↗':'E-Mail-App öffnen ↗';
  web.hidden=platform==='desktop';
  const primary=platform==='ios'?mail:gmail;
  const secondary=platform==='ios'?gmail:mail;
  primary.classList.remove('button-outline');secondary.classList.add('button-outline');
  primary.setAttribute('autofocus','');secondary.removeAttribute('autofocus');
  document.querySelector('#reservation-email-options').replaceChildren(primary,secondary,web);
  if(platform==='desktop'){gmail.target='_blank';gmail.rel='noopener noreferrer';}
  else{gmail.removeAttribute('target');gmail.removeAttribute('rel');}
  document.querySelector('#reservation-email-help').textContent=platform==='desktop'?'Öffnen Sie Gmail im Browser oder Ihr E-Mail-Programm. Senden Sie dort die vorbereitete E-Mail ab.':'Wählen Sie Mail oder Gmail. Öffnet sich keine App, nutzen Sie Gmail im Browser. Mail öffnet Ihre Standard-Mail-App.';
  document.querySelector('#reservation-email-address').textContent=EMAIL_ADDRESS;
  document.querySelector('#reservation-email-copy-status').textContent='';
  form.hidden=true;review.hidden=false;steps[0].removeAttribute('aria-current');steps[1].setAttribute('aria-current','step');
  document.querySelector('#reservation-review-title').focus({preventScroll:true});
  document.querySelector('#reservation-booking').scrollIntoView({block:'start',behavior:'instant'});
  openEmail();
 });
 send.addEventListener('click',openEmail);
 for(const link of [gmail,mail,web])link.addEventListener('click',event=>{if(!validTime())event.preventDefault();});
 document.querySelector('#close-reservation-email').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{if(!review.hidden)send.focus({preventScroll:true});});
 document.querySelector('#edit-reservation').addEventListener('click',()=>{edit();slots();form.elements.guests.focus();});
 async function copyMessage() {
  const status=document.querySelector(dialog.open?'#reservation-email-copy-status':'#reservation-copy-status');
  try {await navigator.clipboard.writeText(message);status.textContent='Anfrage kopiert. Sie können sie in Ihre E-Mail einfügen.';}
  catch {if(dialog.open)dialog.close();const range=document.createRange();range.selectNodeContents(document.querySelector('#reservation-message'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector('#reservation-copy-status').textContent='Bitte kopieren Sie den markierten Text.';}
 }
 document.querySelector('#copy-reservation').addEventListener('click',copyMessage);
 document.querySelector('#copy-reservation-email').addEventListener('click',copyMessage);
}
