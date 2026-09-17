import test from 'node:test';
import assert from 'node:assert/strict';
import { emailPlatform, emailComposeLinks } from '../assets/js/email-compose.js';

const to='info@hana84.co';
const subject='Tischreservierung – HANA';
const body='Name: Nguyễn & Müller\nWünsche: Kinderstuhl? + Sushi #1; 18:30 Uhr';

test('Email platform recognizes phones, iPad desktop mode and actual desktops',()=>{
 assert.equal(emailPlatform({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'}),'ios');
 assert.equal(emailPlatform({userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 9)'}),'android');
 assert.equal(emailPlatform({platform:'MacIntel',maxTouchPoints:5}),'ios');
 assert.equal(emailPlatform({platform:'MacIntel',maxTouchPoints:0}),'desktop');
 assert.equal(emailPlatform({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',maxTouchPoints:10}),'desktop');
});

test('Desktop Gmail and standard mail preserve recipient and the complete Unicode request',()=>{
 const links=emailComposeLinks(to,subject,body);
 const gmail=new URL(links.gmail);
 assert.equal(gmail.origin,'https://mail.google.com');
 assert.equal(gmail.searchParams.get('to'),to);
 assert.equal(gmail.searchParams.get('su'),subject);
 assert.equal(gmail.searchParams.get('body'),body);
 const mail=new URL(links.mail);
 assert.equal(mail.protocol,'mailto:');assert.equal(mail.pathname,to);
 assert.equal(mail.searchParams.get('subject'),subject);
 assert.equal(mail.searchParams.get('body'),body);
 assert.equal(links.gmail,links.web);
});

test('iPhone Gmail app link preserves the request and provides a separate web fallback',()=>{
 const links=emailComposeLinks(to,subject,body,'ios');
 const gmail=new URL(links.gmail);
 assert.equal(gmail.protocol,'googlegmail:');assert.equal(gmail.pathname,'/co');
 assert.equal(gmail.searchParams.get('to'),to);
 assert.equal(gmail.searchParams.get('subject'),subject);
 assert.equal(gmail.searchParams.get('body'),body);
 assert.ok(links.mail.startsWith('mailto:'));
 assert.ok(links.web.startsWith('https://mail.google.com/'));
});

test('Android Gmail intent targets Gmail, escapes payload delimiters and preserves web fallback',()=>{
 const links=emailComposeLinks(to,subject,body,'android');
 assert.ok(links.gmail.startsWith(`intent:${to}?`));
 const [payload,intent]=links.gmail.split('#Intent;');
 assert.equal(new URL(`mailto:${payload.slice('intent:'.length)}`).searchParams.get('body'),body);
 assert.match(intent,/scheme=mailto;action=android.intent.action.SENDTO;package=com.google.android.gm;/);
 const fallback=intent.match(/S.browser_fallback_url=([^;]+);end$/)[1];
 assert.equal(decodeURIComponent(fallback),links.web);
 assert.equal(new URL(decodeURIComponent(fallback)).searchParams.get('body'),body);
});
