import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { MENU } from '../assets/js/menu.js';
const html=await readFile('index.html','utf8');
test('Static page has no broken internal anchor or asset links',async()=>{
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const url=match[1];
  if(/^(?:https?:|mailto:|tel:|data:)/.test(url))continue;
  if(url.startsWith('#')){assert.ok(ids.has(url.slice(1)),url);continue;}
  await access('dist/'+url.split(/[?#]/)[0]);
 }
 assert.ok(!html.includes('{{'));
});
test('SEO metadata and supplied schedule are present in static HTML',()=>{
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
 assert.equal(schema['@type'],'Restaurant');
 assert.deepEqual(schema.openingHoursSpecification.map(h=>[h.opens,h.closes]),[['12:00','14:30'],['17:00','22:00'],['12:00','15:00'],['16:00','22:00']]);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 const description=html.match(/<meta name="description" content="([^"]+)"/)[1];
 assert.ok(description.length>=140&&description.length<=165);
 for(const category of MENU.categories)for(const item of category.items)assert.ok(html.includes(`data-item="${item.id}"`));
});
