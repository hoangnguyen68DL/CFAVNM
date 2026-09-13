import json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
path=root/'outputs/Mock-1-Session-1-2026.json'
bank=json.loads(path.read_text(encoding='utf8'))
# Transcribed table structure, preserving the supplied PDF values.
spec={
29:('Market |','Which market',['Market','Number of Sellers','Non-price Competition'],[['Market 1','Many','None'],['Market 2','Few','Strong'],['Market 3','Many','Strong']]),
35:('Cost of equity','If there are',['Item','Value'],[['Cost of equity if no debt is issued','12%'],['Cost of debt','6%'],['Percent of debt in capital structure','30%']]),
37:('Statement 1 |',None,['Statement','Description'],[['Statement 1','The IRR assumes reinvestment of cash flows at the required rate of return.'],['Statement 2','IRR is strongly preferred when NPV and IRR rank two mutually exclusive projects differently.'],['Statement 3','NPV is zero when IRR equals the hurdle rate.']]),
39:('Costs incurred','If all the criteria',['Expenditures','£ millions'],[['Costs incurred during research phase','10'],['Development costs incurred after reaching technical feasibility','15']]),
43:('Item |','Using vertical',['Item','Year 2','Year 1'],[['Total assets','90','100'],['Total liabilities','36','40'],['Total net assets','54','60']]),
44:('Year 2 |','From Year 1',['Item','Year 2','Year 1'],[['Cash','20','20'],['Receivables','60','50'],['Highly marketable short-term securities','40','50'],['Inventories','80','70'],['Current liabilities','100','100']]),
46:('Currency Pair |','USD/EUR is',['Currency Pair','Spot Rate','Expected Spot Rate in One Year'],[['USD/EUR','1.1800','1.1650']]),
48:('Cash |','The quick ratio',['Item','€ millions'],[['Cash','200'],['Short-term marketable investments','300'],['Receivables','1,000'],['Inventory','1,500'],['Current liabilities','5,000']]),
51:('Variance of X |','Based on the sample',['Metric','Value'],[['Variance of X','9'],['Variance of Y','15'],['Covariance of Y and X','12']]),
55:('Market value of equity','The company\'s WACC',['Item','Value'],[['Market value of equity','$64 million'],['Cost of equity','14%'],['Market value of debt','$20 million'],['Before-tax cost of debt','5%'],['Marginal tax rate','30%']]),
56:('Item |','The analyst\'s gross',['Item','Current Amount (in $ millions)','Forecasted Growth'],[['Sales','1,200','4%'],['Cost of sales','300','8%']]),
60:('Item |','Based on the quick',['Item','Company 1','Company 2','Company 3'],[['Cash','2.5','2.0','1.5'],['Short-term marketable instruments','4.0','1.0','1.0'],['Receivables','2.0','2.0','1.0'],['Inventory','1.0','1.0','3.0'],['Current liabilities','5.0','2.5','2.0']]),
63:('Year 2 |','The best conclusion',['Year 2','¥ millions'],[['Total debt','2,300'],["Total shareholders' equity",'17,000'],['Total assets','20,000'],['Net income','375'],['Interest payments/interest expense','200'],['Taxes paid','125']]),
67:('Year |','Which of the following returns',['Year','Price'],[['1','€6'],['2','€10'],['3','€12']]),
71:('Year |','If the annual target',['Year','Return'],[['1','5%'],['2','−2%'],['3','3%'],['4','8%']]),
80:('Inflation premium','If the short-term',['Risk premium','Value'],[['Inflation premium','1.5%'],['Default risk premium','2.0%'],['Liquidity premium','1.0%'],['Maturity premium','1.5%']]),
82:('Item Description |','Which of the following statements',['Item Description','$ thousands'],[['Carrying value amount','36,000'],['Undiscounted expected future cash flows','38,000'],['Present value of expected future cash flows','32,000'],['Fair value if sold','34,000'],['Costs to sell','4,000']])}
legacy={}
for n,(start,end,headers,rows) in spec.items():
    q=bank['questions'][n-1];stem=q['stem'];a=stem.index(start);b=stem.index(end,a) if end else len(stem)
    blocks=[{'type':'text','text':stem[:a].strip()},{'type':'table','headers':headers,'rows':rows}]
    if n==63:blocks.append({'type':'table','headers':['Ratios in Year 1','Value'],'rows':[['Debt to capital','12.7%'],['Interest coverage','2.9']]})
    if end:blocks.append({'type':'text','text':stem[b:].strip()})
    q['content']=blocks;legacy[stem]=blocks
path.write_text(json.dumps(bank,ensure_ascii=False,indent=2),encoding='utf8')
js=root/'work/mock-room.js';s=js.read_text(encoding='utf8')
s=s.replace("  const fmt=s=>",'  const legacyTableContent='+json.dumps(legacy,ensure_ascii=False)+';\n  const fmt=s=>',1)
s=s.replace('<h2 id="mockRoomStem"></h2>','<div id="mockRoomStem" class="mock-question-content"></div>')
s=s.replace("$('mockRoomStem').textContent=q.stem;","renderQuestionContent(q);")
s=s.replace('stem:q.stem,options:','stem:q.stem,content:validateContent(q.content)||legacyTableContent[q.stem],options:')
s=s.replace('  function render(){', '''  function validateContent(content){
    if(content===undefined)return undefined;
    if(!Array.isArray(content)||!content.length)throw Error('Nội dung câu hỏi không hợp lệ.');
    return content.map(block=>{
      if(block.type==='text'&&typeof block.text==='string')return {type:'text',text:block.text};
      if(block.type==='table'&&Array.isArray(block.headers)&&block.headers.length&&block.headers.every(x=>typeof x==='string')&&Array.isArray(block.rows)&&block.rows.length&&block.rows.every(row=>Array.isArray(row)&&row.length===block.headers.length&&row.every(x=>typeof x==='string'||typeof x==='number')))return {type:'table',headers:block.headers,rows:block.rows};
      throw Error('Bảng trong câu hỏi có hàng/cột không hợp lệ.');
    });
  }
  function renderQuestionContent(q){
    const host=$('mockRoomStem');host.replaceChildren();
    const blocks=q.content||legacyTableContent[q.stem]||[{type:'text',text:q.stem}];
    for(const block of blocks){
      if(block.type==='text'){const p=document.createElement('p');p.textContent=block.text;host.append(p);continue}
      const wrap=document.createElement('div'),table=document.createElement('table'),head=document.createElement('thead'),body=document.createElement('tbody'),tr=document.createElement('tr');
      wrap.className='mock-question-table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Bảng dữ liệu câu '+(current+1));
      block.headers.forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;tr.append(th)});head.append(tr);
      block.rows.forEach(row=>{const tr=document.createElement('tr');row.forEach((text,i)=>{const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=text;tr.append(cell)});body.append(tr)});
      table.append(head,body);wrap.append(table);host.append(wrap);
    }
  }
  function render(){''',1)
js.write_text(s,encoding='utf8')
print('Updated 17 table questions, including two tables in question 63. Legacy rendering preserves existing attempts.')
