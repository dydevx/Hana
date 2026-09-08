import * as config from './config.js';
import { MENU } from './menu.js';
import { money, escapeHTML as e, germanNow, addDays, isOpen, pickupSlots, sanitizeCart, cartTotal, orderMessage } from './core.js';
import { initMotion } from './motion.js';
import { initReservation } from './reservation.js';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const items=new Map((MENU.verified?MENU.categories:[]).flatMap(category=>category.items).map(item=>[item.id,item]));
const storageKey='hana-cart-v1';
let cart=[];
let timer;
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
try{cart=sanitizeCart(JSON.parse(localStorage.getItem(storageKey)||'[]'),items);}catch{cart=[];}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(cart));}catch{notify('Ihr Browser kann den Warenkorb nicht dauerhaft speichern.');}}
function resetCheckout(){ $('#checkout').hidden=true;$('#order-review').hidden=true;$('#order-copy-status').textContent=''; }
function renderCart(){
 $('#cart-items').hidden=false;
 const count=cart.reduce((sum,row)=>sum+row.quantity,0);
 $$('[data-cart-count]').forEach(el=>el.textContent=count);
 $('.cart-trigger').setAttribute('aria-label',`Warenkorb öffnen, ${count} Artikel`);
 $$('[data-cart-summary]').forEach(el=>el.textContent=`${count} ${count===1?'Artikel':'Artikel'} · ${money(cartTotal(cart,items))}`);
 $('#cart-footer').hidden=!cart.length;
 $('#cart-items').innerHTML=cart.length?cart.map(row=>{const i=items.get(row.id);return `<article class="cart-row"><div><h3>${e(i.number)}. ${e(i.name)}</h3>${i.variant?`<p class="small">${e(i.variant)}</p>`:''}${i.quantityLabel?`<p class="small">${e(i.quantityLabel)}</p>`:''}<p class="small">Einzelpreis: ${money(i.priceCents)}</p><div class="quantity-controls"><button data-quantity="${e(i.id)}" data-change="-1" aria-label="Anzahl verringern: ${e(i.name)}">−</button><span aria-label="Anzahl">${row.quantity}</span><button data-quantity="${e(i.id)}" data-change="1" ${row.quantity>=99?'disabled':''} aria-label="Anzahl erhöhen: ${e(i.name)}">+</button></div><button class="remove-item" data-remove="${e(i.id)}" aria-label="${e(i.name)} entfernen">Entfernen</button></div><span class="cart-row-price">${money(i.priceCents*row.quantity)}</span></article>`;}).join(''):`<div class="empty-cart"><h3>Noch Platz für etwas Gutes.</h3><p>Ihr Warenkorb ist noch leer. Entdecken Sie unsere Speisekarte.</p><a class="button" href="#speisekarte" data-close>Zur Speisekarte →</a></div>`;
 $('#cart-total').textContent=money(cartTotal(cart,items));
 renderMenuBasket();
}
function syncDishCounts(){
 $$('.dish').forEach(dish=>{
  const add=dish.querySelector('[data-add]');const badge=dish.querySelector('[data-dish-count]');if(!add||!badge)return;
  const selected=add.dataset.add;
  const count=cart.find(row=>row.id===selected)?.quantity||0;
  badge.textContent=count?`${count} ×`:'';
  dish.classList.toggle('is-in-cart',count>0);
 });
}
function renderMenuBasket(){
 const preview=$('#menu-basket-items');
 if(preview)preview.innerHTML=cart.length?`<ul>${cart.slice(-3).map(row=>{const i=items.get(row.id);return `<li><span class="basket-quantity">${row.quantity}×</span><div><strong>${e(i.name)}</strong>${i.variant?`<small>${e(i.variant)}</small>`:''}</div><span>${money(i.priceCents*row.quantity)}</span></li>`;}).join('')}</ul>${cart.length>3?`<p class="basket-more">+ ${cart.length-3} weitere Positionen im Warenkorb</p>`:''}`:`<div class="basket-empty"><img src="assets/images/handbag.svg" width="36" height="36" alt=""><p>Worauf haben Sie Lust?</p><span>Fügen Sie Ihre Lieblingsgerichte hinzu. Wir bereiten alles frisch für Sie zu.</span></div>`;
 const basketTotal=$('[data-basket-total]');if(basketTotal)basketTotal.textContent=money(cartTotal(cart,items));syncDishCounts();
}
function updateCart(){resetCheckout();save();renderCart();}
renderCart();
const nav=$('#navigation');const navToggle=$('.nav-toggle');
function closeNav(){nav.classList.remove('is-open');navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Navigation öffnen');}
navToggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',open);navToggle.setAttribute('aria-label',open?'Navigation schließen':'Navigation öffnen');});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeNav();});
document.addEventListener('keydown',event=>{if(event.key==='Escape' && nav.classList.contains('is-open')){closeNav();navToggle.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))closeNav();});
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){$$('#navigation a').forEach(a=>{if(a.hash===`#${entry.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -60% 0px',threshold:0});
$$('main>section[id]').forEach(section=>observer.observe(section));
function updateStatus(){$$('[data-open-status]').forEach(el=>{const open=isOpen();el.textContent=open?'Jetzt geöffnet':'Geschlossen';el.classList.toggle('is-open',open);el.title='Ortszeit Olsberg · Europe/Berlin';});}
updateStatus();setInterval(updateStatus,60000);
document.addEventListener('click',event=>{
 const open=event.target.closest('[data-open-cart]');if(open){closeNav();$('#cart-dialog').showModal();}
 const close=event.target.closest('[data-close]');if(close)close.closest('dialog')?.close();
 const add=event.target.closest('[data-add]');if(add && items.has(add.dataset.add)){
  const row=cart.find(row=>row.id===add.dataset.add);if(row?.quantity>=99){notify('Maximal 99 Stück pro Gericht.');return;}
  if(row)row.quantity++;else cart.push({id:add.dataset.add,quantity:1});updateCart();notify(`${items.get(add.dataset.add).name} wurde hinzugefügt.`);
 }
 const quantity=event.target.closest('[data-quantity]');if(quantity){const row=cart.find(row=>row.id===quantity.dataset.quantity);if(!row)return;row.quantity=Math.min(99,row.quantity+Number(quantity.dataset.change));cart=cart.filter(row=>row.quantity>0);updateCart();const next=$$('[data-quantity]').find(el=>el.dataset.quantity===quantity.dataset.quantity && el.dataset.change===quantity.dataset.change);(next||$('#cart-dialog .close-button')).focus();}
 const remove=event.target.closest('[data-remove]');if(remove){cart=cart.filter(row=>row.id!==remove.dataset.remove);updateCart();$('#cart-dialog .close-button').focus();notify('Gericht entfernt.');}
});
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}));
$('#clear-cart').addEventListener('click',()=>{cart=[];updateCart();notify('Warenkorb geleert.');});
const MENU_PAGE_SIZE=8;
let filter='all';
let menuPage=1;
let activeCategory=MENU.categories.some(c=>`#category-${c.id}`===location.hash)?location.hash.slice(10):'all';
function selectVariant(dish,id) {
 const item=items.get(id);if(!item)return;
 dish.querySelector('[data-dish-number]').textContent=`Nr. ${item.number}`;
 dish.querySelector('[data-dish-description]').textContent=item.description;
 dish.querySelector('[data-dish-price]').textContent=money(item.priceCents);
 dish.querySelector('[data-dish-tags]').textContent=[item.quantityLabel,item.vegan?'Vegan':item.vegetarian?'Vegetarisch':'',item.spicy?'Scharf':''].filter(Boolean).join(' · ');
 const meta=[item.allergens.length?'Allergene (Flyer): '+item.allergens.join(', '):'',item.additives.length?'Zusatzstoffe: '+item.additives.join(', '):''].filter(Boolean).join(' · ');
 dish.querySelector('[data-dish-meta]').textContent=meta;
 dish.querySelector('.dish-details').hidden=!meta;
 const button=dish.querySelector('[data-add]');button.dataset.add=id;
 button.setAttribute('aria-label',`${item.name}${item.variant?' mit '+item.variant:''} hinzufügen`);
 const count=cart.find(row=>row.id===id)?.quantity||0;dish.querySelector('[data-dish-count]').textContent=count?`${count} ×`:'';dish.classList.toggle('is-in-cart',count>0);
}
$$('[data-variant]').forEach(select=>select.addEventListener('change',()=>selectVariant(select.closest('.dish'),select.value)));
function filterMenu(){
 const query=($('#dish-search')?.value||'').trim().toLocaleLowerCase('de');const matchesByDish=new Map();
 $$('.dish').forEach(dish=>{
  const options=(dish.dataset.options||'').split(' ').map(id=>items.get(id)).filter(Boolean);
  const matches=options.filter(i=>{
   const dietaryMatch=filter==='all'||(filter==='vegetarian'?(i.vegetarian||i.vegan):i[filter]);
   return dietaryMatch&&[i.number,i.name,i.description,i.variant].join(' ').toLocaleLowerCase('de').includes(query);
  });
  if(matches.length&&(activeCategory==='all'||dish.dataset.category===activeCategory))matchesByDish.set(dish,matches);
  dish.hidden=true;
 });
 const matching=[...matchesByDish.keys()];const count=matching.length;const pages=Math.max(1,Math.ceil(count/MENU_PAGE_SIZE));menuPage=Math.min(menuPage,pages);
 const visible=new Set(matching.slice((menuPage-1)*MENU_PAGE_SIZE,menuPage*MENU_PAGE_SIZE));
 for(const [dish,matches] of matchesByDish){
  dish.hidden=!visible.has(dish);if(dish.hidden)continue;
  const select=dish.querySelector('[data-variant]');
  if(select){
   [...select.options].forEach(option=>{option.disabled=!matches.some(i=>i.id===option.value);option.hidden=option.disabled;});
   if(!matches.some(i=>i.id===select.value))select.value=matches[0].id;
   selectVariant(dish,select.value);
  }
 }
 $$('.menu-category').forEach(cat=>{cat.hidden=![...cat.querySelectorAll('.dish')].some(d=>!d.hidden);});
 $('#no-results').hidden=count>0;
 if($('#search-status'))$('#search-status').textContent=`${count} ${count===1?'Gericht':'Gerichte'} gefunden`;
 if($('#menu-visible-total'))$('#menu-visible-total').textContent=`${count} ${count===1?'Gericht':'Gerichte'}`;
 if($('#reset-menu'))$('#reset-menu').hidden=!query&&filter==='all'&&activeCategory==='all';
 const pager=$('#menu-pager');pager.hidden=count<=MENU_PAGE_SIZE;
 $('#menu-prev').disabled=menuPage===1;$('#menu-next').disabled=menuPage===pages;
 $('#menu-page-status').textContent=`Seite ${menuPage} von ${pages}`;
 $$('[data-menu-category]').forEach(a=>{if(a.dataset.menuCategory===activeCategory)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 const currentLink=$('[data-menu-category][aria-current]');const categoryNav=$('.menu-category-strip .categories');
 if(currentLink&&categoryNav&&categoryNav.scrollWidth>categoryNav.clientWidth){
  const linkBounds=currentLink.getBoundingClientRect();const navBounds=categoryNav.getBoundingClientRect();
  if(linkBounds.left<navBounds.left||linkBounds.right>navBounds.right)categoryNav.scrollLeft+=linkBounds.left-navBounds.left-(categoryNav.clientWidth-currentLink.offsetWidth)/2;
 }
}
$('#dish-search')?.addEventListener('input',()=>{activeCategory='all';menuPage=1;filterMenu();});
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;menuPage=1;$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b===button));filterMenu();}));
$('#reset-menu')?.addEventListener('click',()=>{activeCategory='all';filter='all';menuPage=1;$('#dish-search').value='';$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter==='all'));filterMenu();$('#dish-search').focus();});
function chooseCategory(id){activeCategory=id;filter='all';menuPage=1;$('#dish-search').value='';$$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filter==='all'));filterMenu();}
$$('[data-menu-category]').forEach(a=>a.addEventListener('click',event=>{
 event.preventDefault();chooseCategory(a.dataset.menuCategory);history.replaceState(null,'',a.hash);$('#menu-results').scrollIntoView({block:'start',behavior:'instant'});
}));
window.addEventListener('hashchange',()=>{const category=MENU.categories.find(c=>`#category-${c.id}`===location.hash);if(category)chooseCategory(category.id);});
$('#menu-prev')?.addEventListener('click',()=>{if(menuPage>1){menuPage--;filterMenu();$('#menu-content').scrollIntoView({block:'start'});}});
$('#menu-next')?.addEventListener('click',()=>{menuPage++;filterMenu();$('#menu-content').scrollIntoView({block:'start'});});
filterMenu();
const form=$('#order-form');
function updateSlots(){const select=form.elements.time;const previous=select.value;const slots=pickupSlots(form.elements.date.value);select.innerHTML=`<option value="">${slots.length?'Bitte wählen':'Keine Abholzeit verfügbar'}</option>`+slots.map(time=>`<option value="${time}">${time} Uhr</option>`).join('');if(slots.includes(previous))select.value=previous;}
$('#checkout-button').addEventListener('click',()=>{if(!cart.length)return;$('#checkout').hidden=false;$('#order-review').hidden=true;const today=germanNow().date;form.elements.date.min=today;if(!form.elements.date.value||form.elements.date.value<today)form.elements.date.value=pickupSlots(today).length?today:addDays(today,1);updateSlots();form.elements.name.focus();});
form.elements.date.addEventListener('change',updateSlots);
let message='';
form.addEventListener('submit',event=>{
 event.preventDefault();$('#form-error').textContent='';const data=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,value.trim()]));
 if(!cart.length){$('#form-error').textContent='Bitte wählen Sie zuerst ein Gericht.';return;}
 if(data.name.length<2 || !/^[+\d() /-]{6,30}$/.test(data.phone)){ $('#form-error').textContent='Bitte geben Sie Ihren vollständigen Namen und eine gültige Telefonnummer ein.';return; }
 if(!pickupSlots(data.date).includes(data.time)){$('#form-error').textContent='Bitte wählen Sie eine verfügbare Abholzeit innerhalb unserer Öffnungszeiten.';updateSlots();return;}
 message=orderMessage(data,cart,items);$('#order-message').textContent=message;
 const send=$('#send-order');
 if(config.WHATSAPP_NUMBER){send.href=`https://wa.me/${config.WHATSAPP_NUMBER.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;send.textContent='Bestellung in WhatsApp öffnen ↗';send.target='_blank';send.rel='noopener noreferrer';}
 else{send.href=`mailto:${config.EMAIL_ADDRESS}?subject=${encodeURIComponent('Neue Bestellung – HANA Japanisches Restaurant')}&body=${encodeURIComponent(message)}`;send.textContent='E-Mail mit Bestellung öffnen ↗';}
 $('#checkout').hidden=true;$('#order-review').hidden=false;$('#cart-items').hidden=true;$('#cart-footer').hidden=true;
 const reviewTitle=$('#order-review h3');reviewTitle.tabIndex=-1;reviewTitle.focus({preventScroll:true});$('#cart-dialog').scrollTop=0;
});
$('#copy-order').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(message);$('#order-copy-status').textContent='Bestellung kopiert.';}catch{const range=document.createRange();range.selectNodeContents($('#order-message'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);$('#order-copy-status').textContent='Bitte kopieren Sie den markierten Bestelltext.';}});
$('#send-order').addEventListener('click',event=>{if(!pickupSlots(form.elements.date.value).includes(form.elements.time.value)){event.preventDefault();renderCart();$('#order-review').hidden=true;$('#checkout').hidden=false;$('#form-error').textContent='Die gewählte Abholzeit ist nicht mehr verfügbar. Bitte wählen Sie eine neue Zeit.';updateSlots();form.elements.time.focus();}});
$('#edit-order').addEventListener('click',()=>{renderCart();$('#order-review').hidden=true;$('#checkout').hidden=false;form.elements.name.focus();});
window.addEventListener('storage',event=>{if(event.key!==storageKey)return;try{cart=sanitizeCart(JSON.parse(event.newValue||'[]'),items);resetCheckout();renderCart();}catch{}});
const photos=$$('[data-photo]');let photoIndex=0;
function showPhoto(index){photoIndex=(index+photos.length)%photos.length;const photo=photos[photoIndex];$('#lightbox-image').src=photo.dataset.photo;$('#lightbox-image').alt=photo.dataset.caption;$('#lightbox-caption').textContent=`${photoIndex+1} / ${photos.length} · ${photo.dataset.caption}`;}
photos.forEach((photo,index)=>photo.addEventListener('click',()=>{showPhoto(index);$('#lightbox').showModal();}));
$('#photo-prev').addEventListener('click',()=>showPhoto(photoIndex-1));$('#photo-next').addEventListener('click',()=>showPhoto(photoIndex+1));
$('#lightbox').addEventListener('keydown',event=>{if(event.key==='ArrowLeft')showPhoto(photoIndex-1);if(event.key==='ArrowRight')showPhoto(photoIndex+1);});
initReservation();
initMotion();
