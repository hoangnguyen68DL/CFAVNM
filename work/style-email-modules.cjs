const fs=require('node:fs');
let s=fs.readFileSync('work/email-template.js','utf8');
const a=s.indexOf(' const rows='),b=s.indexOf('\n return ',a);
s=s.slice(0,a)+` const rows=items.map((m,i)=>\`<tr><td style="padding:0 0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;border:1px solid #e4ebf3;border-radius:9px"><tr><td width="38" valign="top" style="padding:15px 0 15px 14px"><span style="display:inline-block;background:#e3ecf8;color:#315980;border-radius:6px;padding:7px;font-size:11px;font-weight:bold">0\${i+1}</span></td><td style="padding:14px 14px 14px 10px"><a href="\${url}" style="text-decoration:none;font-size:13px;line-height:1.55;font-weight:bold;color:#203b5b">\${esc(m.name)}</a>\${m.topic?\`<div style="font-size:9px;letter-spacing:.5px;line-height:1.5;color:#8292a7;margin-top:5px">\${esc(m.topic)}</div>\`:''}</td><td width="20" style="padding-right:12px;color:#8197b3;font-size:16px">&#8599;</td></tr></table></td></tr>\`).join('');
`+s.slice(b);
fs.writeFileSync('work/email-template.js',s);
fs.writeFileSync('netlify/lib/email-template.mjs',s.replace('window.CharterEmailTemplate=','export const CharterEmailTemplate='));
