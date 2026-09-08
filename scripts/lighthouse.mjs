import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const profile=path.resolve('test-results/lighthouse-profile');
await mkdir(profile,{recursive:true});
const chrome=await launch({chromePath:chromium.executablePath(),userDataDir:profile,chromeFlags:['--headless','--no-sandbox']});
try{const result=await lighthouse('http://127.0.0.1:3000/',{port:chrome.port,output:'json',onlyCategories:['performance','accessibility','best-practices','seo'],logLevel:'error'});await writeFile('test-results/lighthouse.json',result.report);console.log(JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([key,value])=>[key,Math.round(value.score*100)]))));console.log(JSON.stringify(Object.entries(result.lhr.audits).filter(([,v])=>v.score!==null && v.score<1).map(([key,v])=>({id:key,score:v.score,title:v.title,details:v.displayValue})),null,2));}finally{await chrome.kill();}
