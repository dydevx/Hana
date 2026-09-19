import { chromium, devices, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { WHATSAPP_NUMBER } from '../assets/js/config.js';

await mkdir('test-results',{recursive:true});
const browser=await chromium.launch();
try {
 for(const [name,settings,protocol,primary] of [
  ['desktop',{viewport:{width:1440,height:1000}},'https:','reservation-gmail'],
  ['iphone',{...devices['iPhone 13'],viewport:{width:320,height:740}},'googlegmail:','reservation-mail'],
  ['android',devices['Pixel 7'],'intent:','reservation-gmail'],
 ]) {
  const context=await browser.newContext({...settings,locale:'de-DE'});
  const page=await context.newPage();
  if(name==='desktop'){
   await context.route('https://mail.google.com/**',route=>route.fulfill({contentType:'text/html',body:'<p>Gmail compose test target. No email sent.</p>'}));
   await context.route('https://wa.me/**',route=>route.fulfill({contentType:'text/html',body:'<p>WhatsApp test target. No message sent.</p>'}));
  }
  else await page.addInitScript(()=>{
   window.emailLaunches=[];
   document.addEventListener('click',event=>{
    const link=event.target.closest('#reservation-email-options a, #send-order');
    if(link){window.emailLaunches.push(link.href);event.preventDefault();}
   },true);
  });
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install({time:new Date('2026-09-07T10:00:00Z')});
  await page.goto('http://127.0.0.1:3000/');
  await page.locator('[data-add]:visible').first().click();
  await page.locator('[data-open-cart]:visible').first().click();
  await page.locator('#checkout-button').click();
  const order=page.locator('#order-form');
  await order.locator('[name=name]').fill('Nguyễn & Müller');
  await order.locator('[name=phone]').fill('+49 123456789');
  await order.locator('[name=date]').fill('2026-09-08');
  await order.locator('[name=time]').selectOption('12:30');
  await order.locator('[name=notes]').fill('Test – nicht senden. Ohne Koriander? + #1;');
  await order.locator('[type=submit]').click();
  const orderMessage=await page.locator('#order-message').textContent();
  const orderHref=await page.locator('#send-order').getAttribute('href');
  assert.equal(new URL(orderHref).origin,'https://wa.me');
  assert.equal(new URL(orderHref).pathname,`/${WHATSAPP_NUMBER.replace(/\D/g,'')}`);
  assert.equal(new URL(orderHref).searchParams.get('text'),orderMessage);
  const orderPopupPromise=name==='desktop'?context.waitForEvent('page'):null;
  await page.locator('#send-order').click();
  if(orderPopupPromise){
   const popup=await orderPopupPromise;await popup.waitForLoadState();
   const compose=new URL(popup.url());
   assert.equal(compose.origin,'https://wa.me');
   assert.equal(compose.pathname,`/${WHATSAPP_NUMBER.replace(/\D/g,'')}`);
   assert.equal(compose.searchParams.get('text'),orderMessage);
   await popup.close();
  }else{
   assert.equal(await page.evaluate(()=>window.emailLaunches.length),1);
   assert.equal(await page.evaluate(()=>window.emailLaunches[0]),orderHref);
   await page.evaluate(()=>{window.emailLaunches=[];});
  }
  const orderAxe=await new AxeBuilder({page}).analyze();
  assert.deepEqual(orderAxe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  assert.ok(await page.locator('#cart-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await page.locator('#cart-dialog .close-button').click();
  const form=page.locator('#reservation-form');
  await form.locator('[name=date]').fill('2026-09-08');
  await form.locator('[name=time]').selectOption('18:30');
  await form.locator('[name=name]').fill('Nguyễn & Müller');
  await form.locator('[name=phone]').fill('+49 123456789');
  await form.locator('[name=notes]').fill('Kinderstuhl? + Sushi #1; Test – nicht senden.');
  // An invalid submit must neither open the chooser nor attempt email navigation.
  await form.locator('[name=phone]').fill('abcdefghi');
  await form.locator('[type=submit]').click();
  await expect(page.locator('#reservation-email-dialog')).not.toBeVisible();
  await form.locator('[name=phone]').fill('+49 123456789');
  const popupPromise=name==='desktop'?context.waitForEvent('page'):null;
  await form.locator('[type=submit]').click();
  if(popupPromise){
   const popup=await popupPromise;
   await popup.waitForLoadState();
   const compose=new URL(popup.url());
   assert.equal(compose.origin,'https://mail.google.com');
   assert.equal(compose.searchParams.get('to'),'info@hana84.co');
   assert.equal(compose.searchParams.get('body'),await page.locator('#reservation-message').textContent());
   await popup.close();
  }else{
   const launches=await page.evaluate(()=>window.emailLaunches);
   assert.equal(launches.length,1,'Submit must immediately attempt email navigation');
   assert.equal(new URL(launches[0]).protocol,name==='iphone'?'mailto:':'intent:');
  }
  const dialog=page.locator('#reservation-email-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator(`#${primary}`)).toBeFocused();
  const href=await page.locator('#reservation-gmail').getAttribute('href');
  assert.equal(new URL(href).protocol,protocol);
  const mail=new URL(await page.locator('#reservation-mail').getAttribute('href'));
  assert.equal(mail.pathname,'info@hana84.co');
  assert.equal(mail.searchParams.get('body'),await page.locator('#reservation-message').textContent());
  assert.equal(await page.locator('#reservation-gmail-web').isVisible(),name!=='desktop');
  if(name==='android')assert.match(href,/package=com.google.android.gm;S.browser_fallback_url=/);
  assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),'Dialog contents must not overflow');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const axe=await new AxeBuilder({page}).analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  await page.screenshot({path:`test-results/reservation-email-${name}.png`});
  await page.locator('#close-reservation-email').click();
  await expect(page.locator('#send-reservation')).toBeFocused();
  const reopenPromise=name==='desktop'?context.waitForEvent('page'):null;
  await page.locator('#send-reservation').click();
  if(reopenPromise){const popup=await reopenPromise;await popup.waitForLoadState();await popup.close();}
  else assert.equal(await page.evaluate(()=>window.emailLaunches.length),2,'Reopen must attempt email navigation again');
  await page.clock.setSystemTime(new Date('2026-09-08T16:15:00Z'));
  // The time guard cancels this link before any external app or Gmail can open.
  await page.locator('#reservation-mail').click();
  await expect(dialog).not.toBeVisible();
  await expect(form).toBeVisible();
  await expect(page.locator('#reservation-error')).toContainText('abgelaufen');
  assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('Orders open WhatsApp links with complete text on desktop and mobile; reservation email options, invalid submits, time guard, responsive layout and accessibility passed. No message sent.');
} finally {await browser.close();}
