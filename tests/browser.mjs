import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
await page.locator('#speisekarte').scrollIntoViewIfNeeded();
await page.locator('#galerie').scrollIntoViewIfNeeded();
await page.locator('.gallery-item img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
await page.evaluate(()=>scrollTo(0,0));
await page.screenshot({path:'test-results/desktop.png',fullPage:true});
await page.screenshot({path:'test-results/desktop-fold.png'});
await page.locator('.site-footer').screenshot({path:'test-results/footer-desktop.png'});
assert.equal(await page.locator('h1').count(),1);
assert.equal(await page.locator('html').getAttribute('lang'),'de');
assert.equal(await page.locator('img:visible').evaluateAll(images=>images.filter(i=>!i.complete||i.naturalWidth===0).length),0);
assert.equal(await page.locator('#map-panel iframe').count(),1);
const axe=await new AxeBuilder({page}).analyze();
await writeFile('test-results/accessibility.json',JSON.stringify(axe.violations,null,2));
assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[]);
await page.locator('.cart-trigger').click();await page.getByRole('heading',{name:'Ihr Warenkorb'}).waitFor();
assert.equal(await page.locator('#cart-footer').isVisible(),false);
await page.keyboard.press('Escape');assert.equal(await page.locator('#cart-dialog').isVisible(),false);
await page.locator('.gallery-item').first().click();assert.equal(await page.locator('#lightbox').isVisible(),true);
await page.keyboard.press('ArrowRight');assert.match(await page.locator('#lightbox-caption').textContent(),/^2 \/ 7/);await page.keyboard.press('Escape');
for(const width of [320,375,390,768,1024]){
 await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal overflow at ${width}`);
 if(width===390){await page.locator('#galerie').scrollIntoViewIfNeeded();await page.locator('.gallery-item img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/mobile.png',fullPage:true});await page.locator('.site-footer').screenshot({path:'test-results/footer-mobile.png'});const mobileAxe=await new AxeBuilder({page}).analyze();assert.deepEqual(mobileAxe.violations.map(v=>v.id),[]);await page.locator('.nav-toggle').click();await page.locator('#navigation a[href="#kontakt"]').click();assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');}
}
assert.deepEqual(errors,[]);
await page.setViewportSize({width:390,height:844});
await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});
await page.screenshot({path:'test-results/mobile-fold.png'});
await browser.close();console.log('Responsive widths, image loading, accessibility, navigation, cart empty state, lightbox and map passed.');
