import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { WHATSAPP_NUMBER } from '../assets/js/config.js';

const browser = await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.HANA_TEST_URL || 'http://127.0.0.1:3000/');
  await page.locator('.mobile-actions [data-open-cart]').click();
  await page.locator('#create-bill').click();
  await expect(page.locator('#toast')).toContainText('Warenkorb ist leer');
  assert.equal(await page.locator('#bill-dialog').isVisible(), false);
  await page.keyboard.press('Escape');

  await page.locator('#dish-search').fill('28G');
  await page.locator('[data-add="hana-28g"]').click();
  await page.locator('.mobile-actions [data-open-cart]').click();
  await page.locator('#create-bill').click();
  await expect(page.locator('#billArea')).toContainText('17,00');
  await page.locator('#close-bill').click();
  await page.keyboard.press('Escape');
  await page.locator('#dish-search').fill('Sake Nigiri');
  await page.locator('[data-add="hana-213"]').click();
  await page.locator('.mobile-actions [data-open-cart]').click();
  await page.locator('[data-quantity="hana-28g"][data-change="1"]').click();
  await expect(page.locator('#cart-total')).toHaveText('39,00 €');
  await page.locator('#checkout-button').click();
  await page.locator('#order-form [name="name"]').fill('Testgast <Hana>');
  await page.locator('#order-form [name="phone"]').fill('+49 123456789');
  await page.locator('#order-form [name="notes"]').fill('Ohne Koriander');
  await page.locator('#create-bill').click();
  await expect(page.locator('#bill-dialog')).toBeVisible();
  await page.setViewportSize({width:320,height:700});
  const modalBounds=await page.locator('#bill-dialog').boundingBox();
  assert.ok(modalBounds.x>=0 && modalBounds.x+modalBounds.width<=320.5, 'Bill modal overflows 320px viewport');
  const axe=await new AxeBuilder({page}).analyze();
  assert.deepEqual(axe.violations.map(violation=>violation.id),[]);
  const bill=page.locator('#billArea');
  for(const text of ['Garnelen', '2 × 28G.', '34,00', 'Sake Nigiri', '5,00', 'Zwischensumme', 'Gesamt', '39,00', 'Testgast <Hana>', 'Ohne Koriander', 'Abholung', 'Bei Abholung']) {
    assert.ok((await bill.textContent()).includes(text), text);
  }
  assert.equal(await bill.locator('script').count(),0);
  const firstNumber=(await bill.textContent()).match(/ORD-\d{8}-\d{6}-\d{3}/)?.[0];
  assert.ok(firstNumber);

  await page.evaluate(() => { window.print=() => { window.__printCalled=true; }; });
  await page.locator('#print-bill').click();
  assert.equal(await page.evaluate(() => window.__printCalled), true);
  await mkdir('test-results',{recursive:true});
  await page.locator('#bill-dialog').screenshot({path:'test-results/bill-mobile.png'});
  await page.emulateMedia({media:'print'});
  const layout=await page.evaluate(() => ({
    width:document.querySelector('#billArea').getBoundingClientRect().width,
    actions:getComputedStyle(document.querySelector('.bill-actions')).display,
    site:getComputedStyle(document.querySelector('.site-header')).display
  }));
  assert.ok(layout.width <= 80 * 96 / 25.4 + 0.5, JSON.stringify(layout));
  assert.equal(layout.actions,'none');
  assert.equal(layout.site,'none');
  const pdf=await page.pdf({path:'test-results/bill.pdf',preferCSSPageSize:true});
  const mediaBox=pdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
  assert.ok(mediaBox, 'PDF page size missing');
  assert.ok(Number(mediaBox[1]) <= 230, `PDF width ${mediaBox[1]}pt exceeds 80mm`);
  await page.emulateMedia({media:'screen'});

  await page.locator('#bill-paper-width').selectOption('58');
  assert.equal(await page.locator('#bill-dialog').getAttribute('data-paper-width'),'58');
  assert.ok(await bill.evaluate(area => area.scrollWidth <= area.clientWidth + 1), '58mm bill content overflows');
  await page.locator('#bill-dialog').screenshot({path:'test-results/bill-58-mobile.png'});
  await page.locator('#print-bill').click();
  await page.emulateMedia({media:'print'});
  const narrowLayout=await page.evaluate(() => ({
    width:document.querySelector('#billArea').getBoundingClientRect().width,
    choice:getComputedStyle(document.querySelector('.bill-paper-choice')).display
  }));
  assert.ok(narrowLayout.width <= 58 * 96 / 25.4 + 0.5, JSON.stringify(narrowLayout));
  assert.equal(narrowLayout.choice,'none');
  const narrowPdf=await page.pdf({path:'test-results/bill-58.pdf',preferCSSPageSize:true});
  const narrowBox=narrowPdf.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
  assert.ok(narrowBox && Number(narrowBox[1]) <= 167, 'PDF exceeds 58mm paper width');
  await page.emulateMedia({media:'screen'});

  await page.locator('#close-bill').click();
  await expect(page.locator('#bill-dialog')).not.toBeVisible();
  await page.locator('[data-quantity="hana-213"][data-change="1"]').click();
  await page.locator('#create-bill').click();
  await expect(page.locator('#billArea')).toContainText('44,00');
  await page.locator('#close-bill').click();
  await page.locator('#checkout-button').click();
  const time=await page.locator('#order-form [name="time"] option').nth(1).getAttribute('value');
  assert.ok(time);
  await page.locator('#order-form [name="time"]').selectOption(time);
  await page.locator('#order-form [type="submit"]').click();
  await expect(page.locator('#order-review')).toBeVisible();
  const message=new URL(await page.locator('#send-order').getAttribute('href')).searchParams.get('text');
  const printLink=message.match(/https?:\/\/\S+#bill2=[A-Za-z0-9_-]+/)?.[0];
  assert.ok(printLink, 'WhatsApp message must contain a self-contained print link');
  assert.ok(printLink.length < 550, `Compressed print link is unexpectedly long: ${printLink.length}`);
  const whatsApp=new URL(await page.locator('#send-order').getAttribute('href'));
  assert.equal(whatsApp.origin,'https://wa.me');
  assert.equal(whatsApp.pathname,`/${WHATSAPP_NUMBER.replace(/\D/g,'')}`);
  assert.equal(whatsApp.searchParams.get('text'),message);
  assert.equal(await page.locator('#order-bill-link').getAttribute('href'),printLink);
  assert.ok(!(await page.locator('#order-message').textContent()).includes('#bill2='), 'Review exposes encoded URL');
  await page.locator('#order-review').screenshot({path:'test-results/order-review-compact.png'});
  await page.locator('#order-bill-link').click();
  await expect(page.locator('#billArea')).toContainText('44,00');
  await page.locator('#close-bill').click();
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));
  await page.locator('#copy-order').click();
  assert.equal(await page.evaluate(() => window.__copied),message,'Zalo copy must retain full receipt link');
  await page.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied');}}}));
  await page.locator('#copy-order').click();
  await expect(page.locator('#order-copy-fallback')).toHaveValue(message);

  const ownerContext=await browser.newContext({viewport:{width:390,height:844}});
  const owner=await ownerContext.newPage();
  await owner.goto(printLink);
  assert.equal(await owner.evaluate(() => localStorage.getItem('hana-cart-v1')),null);
  await expect(owner.locator('#bill-dialog')).toBeVisible();
  await expect(owner.locator('#billArea')).toContainText('44,00');
  await expect(owner.locator('#billArea')).toContainText('Testgast <Hana>');
  assert.equal(owner.url(),printLink,'Opening the receipt must preserve the self-contained link');
  await owner.locator('#bill-paper-width').selectOption('58');
  await owner.evaluate(() => { window.print=() => { window.__printCalled=true; }; });
  await owner.locator('#print-bill').click();
  assert.equal(await owner.evaluate(() => window.__printCalled),true);
  assert.match(await owner.locator('#bill-page-size').evaluate(style => style.textContent),/size: 58mm/);
  await owner.evaluate(() => { window.print=undefined; });
  await owner.locator('#print-bill').click();
  await expect(owner.locator('#bill-print-status')).toContainText('Dieser Browser kann nicht drucken');
  await owner.evaluate(() => { window.print=()=>{throw Error('WebView printing disabled');}; });
  await owner.locator('#print-bill').click();
  await expect(owner.locator('#bill-print-status')).toContainText('Chrome oder Safari');
  await owner.evaluate(() => Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Denied');}}}));
  await owner.locator('#copy-bill-link').click();
  await expect(owner.locator('#bill-link-fallback')).toHaveValue(printLink);
  await owner.locator('#bill-dialog').screenshot({path:'test-results/bill-print-fallback.png'});
  await owner.locator('#close-bill').click();
  await owner.evaluate(()=>{location.hash='speisekarte';});
  await expect(owner.locator('#bill-dialog')).not.toBeVisible();
  await ownerContext.close();
  assert.deepEqual(errors,[]);
  console.log('Bill creation, WhatsApp print link on a clean browser, cart updates, customer details and 80/58mm print CSS passed.');
} finally {
  await browser.close();
}
