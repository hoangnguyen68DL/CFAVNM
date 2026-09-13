import assert from 'node:assert/strict';
import {validateSettings} from '../netlify/lib/reminder-core.mjs';
import {CharterEmailTemplate} from '../netlify/lib/email-template.mjs';
const p=validateSettings({email:'fixture@example.com',name:'Test',morning:true,evening:true,onlyIfBehind:true,morningTime:'08:00',eveningTime:'21:00',days:[1],goal:{date:'2026-09-13',target:1,completed:0,shortfall:1},planDate:'2026-09-14',selected:[{id:'m1',name:'Module',topic:'Quant',schedule:'2026-09-14 · 09:00–10:00'}],upcoming:[]});
assert.equal(p.selected[0].schedule,'2026-09-14 · 09:00–10:00');
const html=CharterEmailTemplate({kind:'morning',goal:p.goal,modules:p.selected,name:p.name});assert(html.includes('09:00–10:00'));assert(!html.includes('undefined'));
const unsafe=CharterEmailTemplate({kind:'morning',goal:p.goal,modules:[{name:'Module',schedule:'<script>alert(1)</script>'}]});assert(!unsafe.includes('<script>'));assert(unsafe.includes('&lt;script&gt;'));
console.log('PASS: schedule survives server validation, email shows lesson times, optional fields remain compatible, schedule text is escaped. No email sent.');
