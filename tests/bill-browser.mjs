import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/');
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
  const message=await page.locator('#order-message').textContent();
  const printLink=message.match(/https?:\/\/\S+#bill=[A-Za-z0-9_-]+/)?.[0];
  assert.ok(printLink, 'Order email must contain a print link');
  assert.equal(new URL(await page.locator('#send-order').getAttribute('href')).searchParams.get('body'),message);

  const ownerContext=await browser.newContext({viewport:{width:390,height:844}});
  const owner=await ownerContext.newPage();
  await owner.goto(printLink);
  assert.equal(await owner.evaluate(() => localStorage.getItem('hana-cart-v1')),null);
  await expect(owner.locator('#bill-dialog')).toBeVisible();
  await expect(owner.locator('#billArea')).toContainText('44,00');
  await expect(owner.locator('#billArea')).toContainText('Testgast <Hana>');
  await owner.evaluate(() => { window.print=() => { window.__printCalled=true; }; });
  await owner.locator('#print-bill').click();
  assert.equal(await owner.evaluate(() => window.__printCalled),true);
  await ownerContext.close();
  assert.deepEqual(errors,[]);
  console.log('Bill creation, emailed print link on a clean browser, cart updates, customer details and 80mm print CSS passed.');
} finally {
  await browser.close();
}
