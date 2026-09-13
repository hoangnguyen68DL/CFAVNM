// The embedded records remain the factory curriculum; saved editions live with study data.
window.CurriculumCore=(()=>{
const original=JSON.parse(JSON.stringify(MODULES));
function validate(input){if(!Array.isArray(input)||input.length>1000)throw Error('Chương trình cần từ 0 đến 1.000 module.');const ids=new Set();return input.map(m=>{if(!m||typeof m.id!=='string'||!/^m[\w-]{1,90}$/.test(m.id)||ids.has(m.id)||typeof m.name!=='string'||!m.name.trim()||m.name.length>500||typeof m.topic!=='string'||!m.topic.trim()||m.topic.length>120||['__proto__','constructor','prototype','ALL'].includes(m.topic)||!Number.isInteger(m.day)||m.day<1||m.day>365)throw Error('Tên, nhóm, mã hoặc ngày học của module không hợp lệ.');ids.add(m.id);return{id:m.id,name:m.name,topic:m.topic,day:m.day}})}
function fromMeta(value){return value?.charterPrep?.curriculum===undefined?JSON.parse(JSON.stringify(original)):validate(value.charterPrep.curriculum)}
try{const saved=JSON.parse(localStorage.getItem('cfa-meta')||'{}');const records=fromMeta(saved);MODULES.splice(0,MODULES.length,...records)}catch{}
return{validate,fromMeta,original:()=>JSON.parse(JSON.stringify(original))};
})();
