// Exam-room interaction shell. The question bank is intentionally local demo data.
(()=>{
  'use strict';
  const $=id=>document.getElementById(id), page=$('ux-page-mocks');
  if(!page)return;
  const seed=[
    {topic:'ETHICS',stem:'Jolene Campbell, CFA, a well-known analyst, is working on a report about XLK Autos (XLK). XLK is developing a fuel-efficient car about which no public information is yet available. Campbell uses financial data and information gathered from automobile experts not connected to XLK about the commercial viability of XLK’s project. She then issues a “buy” recommendation on the stock. Campbell sends her report exclusively to her firm’s clients even though she expects her report to impact XLK’s stock price. Has Campbell most likely violated the Standard relating to material nonpublic information?',options:['No','Yes, because she uses information that is not yet public','Yes, because she fails to make her recommendation public']},
    {topic:'FINANCIAL STATEMENT ANALYSIS',stem:'Which adjustment most directly improves the comparability of two companies that use different inventory accounting methods?',options:['Restate inventory and cost of sales to a common method','Ignore inventory differences because cash flow is unchanged','Compare only the reported gross margin']},
    {topic:'QUANTITATIVE METHODS',stem:'An analyst estimates a positive relationship between two variables. Which result best describes the interpretation of the correlation coefficient?',options:['The variables move together with a measurable linear association','One variable must cause the other to change','The variables have identical values over time']}
  ];
  let demo=Array.from({length:90},(_,i)=>{const q=seed[i%seed.length];return {...q,number:i+1}}),bankTitle='Premium Mock 1 · Session 1 · 2026';
  let current=0,answers={},flags=new Set(),mistakeQuestions=new Set(),seconds=2*3600+1*60+39,timer=null;
  const box=document.createElement('section');box.className='card mock-room-launcher';box.innerHTML='<div><span class="mock-room-kicker">EXAM ROOM · PREMIUM MOCK</span><h2>Phòng thi CFA</h2><p>Giao diện phòng thi theo mẫu thật: 90 câu, đồng hồ, công cụ xem lại và nộp bài trong một phiên riêng.</p><span class="mock-room-import-status" id="mockRoomImportStatus">Đang dùng bộ đề demo</span></div><div class="mock-room-launch-actions"><button class="btn" id="mockRoomStart">Mở phòng thi</button><button class="btn ghost mock-room-import-btn" id="mockRoomImportOpen">＋ Thêm đề JSON</button></div>';page.prepend(box);
  box.hidden=true;
  let catalogTab='all',catalogSort='default',catalogGrid=true,catalogTopic='all',deletedCatalog=new Set();try{deletedCatalog=new Set(JSON.parse(localStorage.getItem('charterprep.deletedMocks')||'[]'))}catch{}
  const catalog=document.createElement('section');catalog.className='mock-catalog-page';catalog.innerHTML='<div class="mock-catalog-head"><div><h1>Luyện đề</h1><p>Chọn một bộ đề để bắt đầu phiên thi.</p></div><button type="button" id="mockRoomImportList" class="btn ghost mock-catalog-import">＋ Thêm đề JSON</button></div><div class="mock-catalog-tabs"><button class="active" data-catalog-tab="all">Tất cả <span id="mockCatalogAll">46</span></button><button data-catalog-tab="todo">Chưa làm <span>44</span></button><button data-catalog-tab="progress">Đang làm dở <span>2</span></button><button data-catalog-tab="submitted">Đã nộp <span>0</span></button></div><div class="mock-catalog-toolbar"><label class="mock-catalog-search">⌕<input placeholder="Tìm đề theo tên hoặc năm" id="mockCatalogSearch"></label><button id="mockCatalogFilterBtn">▽ Bộ lọc</button><button id="mockCatalogSortBtn">⇅ Sắp xếp</button><span class="mock-catalog-count" id="mockCatalogCount">46 đề</span><button id="mockCatalogListBtn" aria-label="Danh sách">▤</button><button id="mockCatalogGridBtn" class="active" aria-label="Lưới">▦</button></div><div class="mock-catalog-filter-panel" id="mockCatalogFilterPanel" hidden><strong>Lọc đề luyện</strong><label>Chủ đề<select id="mockCatalogTopic"><option value="all">Tất cả chủ đề</option><option value="ETHICS">Ethics</option><option value="FSA">Financial Statement Analysis</option><option value="QUANT">Quantitative Methods</option></select></label><button id="mockCatalogClearFilter">Xoá bộ lọc</button></div><div class="mock-catalog-sort-panel" id="mockCatalogSortPanel" hidden><button data-catalog-sort="default">Mặc định</button><button data-catalog-sort="name">Tên A–Z</button><button data-catalog-sort="duration">Thời lượng</button></div><div class="mock-catalog-grid" id="mockCatalogGrid"></div>';page.prepend(catalog);
  const reviewPanel=document.createElement('section');reviewPanel.className='mock-results-dashboard';page.append(reviewPanel);
  catalog.querySelector('.mock-catalog-head').insertAdjacentHTML('beforeend','<button type="button" id="mockPracticeOpen" class="btn mock-practice-open">＋ Practice test</button>');
  $('mockRoomImportList').onclick=()=>$('mockImportDialog').showModal();catalog.querySelector('.mock-catalog-import').onclick=()=>$('mockImportDialog').showModal();
  const practiceDialog=document.createElement('dialog');practiceDialog.className='mock-import-dialog';practiceDialog.id='mockPracticeDialog';practiceDialog.innerHTML='<form method="dialog"><div class="mock-import-head"><div><span class="mock-room-kicker">PRACTICE TEST</span><h2>Create a practice test</h2><p>Choose the number of questions and your exam time.</p></div><button value="cancel" class="mock-import-close" aria-label="Close">×</button></div><div class="mock-import-fields"><label>Questions<input id="practiceQuestionCount" type="number" min="5" max="100" step="1" value="20"></label><label>Time (minutes)<input id="practiceDuration" type="number" min="5" max="240" step="5" value="30"></label></div><p class="mock-import-hint">You can create a short practice session from any imported question bank.</p><div class="mock-import-actions"><button value="cancel" class="btn ghost">Cancel</button><button type="button" id="practiceStart" class="btn">Start practice test</button></div></form>';document.body.append(practiceDialog);
  $('mockPracticeOpen').onclick=()=>practiceDialog.showModal();
  const importDialog=document.createElement('dialog');importDialog.className='mock-import-dialog';importDialog.id='mockImportDialog';importDialog.innerHTML='<form method="dialog"><div class="mock-import-head"><div><span class="mock-room-kicker">IMPORT QUESTION BANK</span><h2>Thêm bộ câu hỏi</h2><p>Đặt tên cho đề trước khi chọn file JSON.</p></div><button value="cancel" class="mock-import-close" aria-label="Đóng">×</button></div><div class="mock-import-type-tabs"><button type="button" class="active" data-import-type="mock">Import Mock</button><button type="button" data-import-type="practice">Import Practice</button></div><div class="mock-import-fields" data-import-fields="mock"><label>Tên đề<input id="mockImportName" placeholder="Premium Mock 1"></label><label>Session<input id="mockImportSession" type="number" min="1" placeholder="1"></label><label>Năm<input id="mockImportYear" type="number" min="2020" max="2100" value="2026"></label></div><div class="mock-import-fields" data-import-fields="practice" hidden><label>Môn<input id="practiceSubject" placeholder="Financial Statement Analysis"></label><label>Đơn vị phát hành<input id="practiceIssuer" placeholder="CFA Institute"></label><label>Thời lượng (phút)<input id="practiceImportDuration" type="number" min="5" max="480" step="5" placeholder="60"></label><label>Năm<input id="practiceImportYear" type="number" min="2020" max="2100" value="2026"></label></div><input id="mockRoomImport" type="file" accept="application/json,.json" hidden><p class="mock-import-hint">Bạn có thể đặt thời lượng riêng cho từng bộ đề; để trống sẽ dùng thời lượng trong file JSON hoặc 135 phút.</p><div class="mock-import-actions"><button value="cancel" class="btn ghost">Huỷ</button><button type="button" id="mockImportChoose" class="btn">Chọn file JSON</button></div></form>';document.body.append(importDialog);$('mockRoomImportOpen').onclick=()=>$('mockImportDialog').showModal();
  const dialog=document.createElement('dialog');dialog.className='mock-room-dialog';dialog.id='mockRoomDialog';dialog.innerHTML=`
    <div class="mock-room-top"><div class="mock-room-brand"><strong id="mockRoomTitle">Premium Mock 1 · Session 1 · 2026</strong><small id="mockRoomCounter">Câu 1/90</small></div><div class="mock-room-top-actions"><span class="mock-room-answered" id="mockRoomAnswered">Đã trả lời 0/90</span><span class="mock-room-clock" id="mockRoomClock">02:01:39</span><button class="mock-room-settings-btn" id="mockRoomSettings" aria-label="Cài đặt phòng thi">☷</button><button class="btn ghost" id="mockRoomExit">⇥ Thoát</button><button class="btn" id="mockRoomSubmit">Nộp bài</button></div></div>
    <div class="mock-room-settings" id="mockRoomSettingsPanel" hidden><span>CỠ CHỮ</span><div class="mock-room-setting-row"><button data-size="sm">A</button><button data-size="md" class="active">A</button><button data-size="lg">A</button><button data-size="xl">A</button></div><span>GIAO DIỆN</span><div class="mock-room-setting-row theme"><button data-theme="light" class="active">☼ Sáng</button><button data-theme="dark">☾ Tối</button></div></div>
    <div class="mock-room-body"><aside class="mock-room-sidebar"><span class="mock-room-side-title">DANH SÁCH CÂU</span><div class="mock-room-question-nav" id="mockRoomNav"></div><p class="mock-room-legend"><i></i>Đã trả lời <i class="flag"></i>Xem lại</p></aside><main class="mock-room-main"><div class="mock-room-question-card"><div class="mock-room-question-meta"><span id="mockRoomQuestionNo">1</span><span id="mockRoomTopic">ETHICS</span><span id="mockRoomQuestionTime">◷ 01:58</span><div class="mock-room-question-tools"><button class="mock-room-icon" id="mockRoomNote" aria-label="Ghi chú">▱</button><button class="mock-room-icon" id="mockRoomClear" aria-label="Xoá lựa chọn">⌫</button><button class="mock-room-icon" id="mockRoomFlag" aria-label="Đánh dấu xem lại">⚑</button></div></div><div id="mockRoomStem" class="mock-question-content"></div><div id="mockRoomOptions" class="mock-room-options"></div></div><div class="mock-room-nav-actions"><button class="btn ghost" id="mockRoomPrev">‹&nbsp; Câu trước</button><button class="btn" id="mockRoomNext">Câu sau&nbsp; ›</button></div></main></div>`;
  document.body.append(dialog);
  const legacyTableContent={"An analyst gathers the following information about three markets: Market | Number of Sellers | Non-price Competition; Market 1 | Many | None; Market 2 | Few | Strong; Market 3 | Many | Strong; Which market is most likely monopolistically competitive?": [{"type": "text", "text": "An analyst gathers the following information about three markets:"}, {"type": "table", "headers": ["Market", "Number of Sellers", "Non-price Competition"], "rows": [["Market 1", "Many", "None"], ["Market 2", "Few", "Strong"], ["Market 3", "Many", "Strong"]]}, {"type": "text", "text": "Which market is most likely monopolistically competitive?"}], "An analyst gathers the following information about a firm: Cost of equity if no debt is issued | 12%; Cost of debt | 6%; Percent of debt in capital structure | 30%; If there are no taxes, the WACC estimated using Modigliani-Miller Proposition II is closest to:": [{"type": "text", "text": "An analyst gathers the following information about a firm:"}, {"type": "table", "headers": ["Item", "Value"], "rows": [["Cost of equity if no debt is issued", "12%"], ["Cost of debt", "6%"], ["Percent of debt in capital structure", "30%"]]}, {"type": "text", "text": "If there are no taxes, the WACC estimated using Modigliani-Miller Proposition II is closest to:"}], "Which of the following statements is most accurate? Statement 1 | The IRR assumes reinvestment of cash flows at the required rate of return.; Statement 2 | IRR is strongly preferred when NPV and IRR rank two mutually exclusive projects differently.; Statement 3 | NPV is zero when IRR equals the hurdle rate.;": [{"type": "text", "text": "Which of the following statements is most accurate?"}, {"type": "table", "headers": ["Statement", "Description"], "rows": [["Statement 1", "The IRR assumes reinvestment of cash flows at the required rate of return."], ["Statement 2", "IRR is strongly preferred when NPV and IRR rank two mutually exclusive projects differently."], ["Statement 3", "NPV is zero when IRR equals the hurdle rate."]]}], "An analyst gathers the following information (in £ millions) about a company's expenditures in developing an intangible asset for internal use: Costs incurred during research phase | 10; Development costs incurred after reaching technical feasibility | 15; If all the criteria for capitalization have been met, the maximum amount of expenditures (in £ millions) eligible for capitalization is most likely:": [{"type": "text", "text": "An analyst gathers the following information (in £ millions) about a company's expenditures in developing an intangible asset for internal use:"}, {"type": "table", "headers": ["Expenditures", "£ millions"], "rows": [["Costs incurred during research phase", "10"], ["Development costs incurred after reaching technical feasibility", "15"]]}, {"type": "text", "text": "If all the criteria for capitalization have been met, the maximum amount of expenditures (in £ millions) eligible for capitalization is most likely:"}], "An analyst gathers the following information (in £ millions) about a company: Item | Year 2 | Year 1; Total assets | 90 | 100; Total liabilities | 36 | 40; Total net assets | 54 | 60; Using vertical common-size balance sheet analysis, the company's tTotal liabilities in Year 2 are closest to:": [{"type": "text", "text": "An analyst gathers the following information (in £ millions) about a company:"}, {"type": "table", "headers": ["Item", "Year 2", "Year 1"], "rows": [["Total assets", "90", "100"], ["Total liabilities", "36", "40"], ["Total net assets", "54", "60"]]}, {"type": "text", "text": "Using vertical common-size balance sheet analysis, the company's tTotal liabilities in Year 2 are closest to:"}], "An analyst gathers the following year-end information (in € thousands) about a company's current assets and current liabilities: Year 2 | Year 1; Cash | 20 | 20; Receivables | 60 | 50; Highly marketable short-term securities | 40 | 50; Inventories | 80 | 70; Current liabilities | 100 | 100; From Year 1 to Year 2, the cash ratio:": [{"type": "text", "text": "An analyst gathers the following year-end information (in € thousands) about a company's current assets and current liabilities:"}, {"type": "table", "headers": ["Item", "Year 2", "Year 1"], "rows": [["Cash", "20", "20"], ["Receivables", "60", "50"], ["Highly marketable short-term securities", "40", "50"], ["Inventories", "80", "70"], ["Current liabilities", "100", "100"]]}, {"type": "text", "text": "From Year 1 to Year 2, the cash ratio:"}], "An analyst gathers the following information about a currency pair: Currency Pair | Spot Rate | Expected Spot Rate in One Year; USD/EUR | 1.1800 | 1.1650; USD/EUR is the amount of USD per one EUR The expected change in value of the dollar relative to the euro over the next year is closest to a(n):": [{"type": "text", "text": "An analyst gathers the following information about a currency pair:"}, {"type": "table", "headers": ["Currency Pair", "Spot Rate", "Expected Spot Rate in One Year"], "rows": [["USD/EUR", "1.1800", "1.1650"]]}, {"type": "text", "text": "USD/EUR is the amount of USD per one EUR The expected change in value of the dollar relative to the euro over the next year is closest to a(n):"}], "An analyst gathers the following information (in € millions) about a company's current assets and liabilities: Cash | 200; Short-term marketable investments | 300; Receivables | 1,000; Inventory | 1,500; Current liabilities | 5,000; The quick ratio is:": [{"type": "text", "text": "An analyst gathers the following information (in € millions) about a company's current assets and liabilities:"}, {"type": "table", "headers": ["Item", "€ millions"], "rows": [["Cash", "200"], ["Short-term marketable investments", "300"], ["Receivables", "1,000"], ["Inventory", "1,500"], ["Current liabilities", "5,000"]]}, {"type": "text", "text": "The quick ratio is:"}], "An analyst calculates the following metrics about a sample of paired observations of a dependent variable Y and an independent variable X: Variance of X | 9; Variance of Y | 15; Covariance of Y and X | 12; Based on the sample, the slope coefficient of the simple linear regression of Y to X is closest to:": [{"type": "text", "text": "An analyst calculates the following metrics about a sample of paired observations of a dependent variable Y and an independent variable X:"}, {"type": "table", "headers": ["Metric", "Value"], "rows": [["Variance of X", "9"], ["Variance of Y", "15"], ["Covariance of Y and X", "12"]]}, {"type": "text", "text": "Based on the sample, the slope coefficient of the simple linear regression of Y to X is closest to:"}], "An analyst gathers the following information about a company: Market value of equity | $64 million; Cost of equity | 14%; Market value of debt | $20 million; Before-tax cost of debt | 5%; Marginal tax rate | 30%; The company's WACC is closest to:": [{"type": "text", "text": "An analyst gathers the following information about a company:"}, {"type": "table", "headers": ["Item", "Value"], "rows": [["Market value of equity", "$64 million"], ["Cost of equity", "14%"], ["Market value of debt", "$20 million"], ["Before-tax cost of debt", "5%"], ["Marginal tax rate", "30%"]]}, {"type": "text", "text": "The company's WACC is closest to:"}], "An analyst uses the following information to forecast a company's gross profit margin: Item | Current Amount (in $ millions) | Forecasted Growth; Sales | 1,200 | 4%; Cost of sales | 300 | 8%; The analyst's gross margin forecast would be closest to a(n):": [{"type": "text", "text": "An analyst uses the following information to forecast a company's gross profit margin:"}, {"type": "table", "headers": ["Item", "Current Amount (in $ millions)", "Forecasted Growth"], "rows": [["Sales", "1,200", "4%"], ["Cost of sales", "300", "8%"]]}, {"type": "text", "text": "The analyst's gross margin forecast would be closest to a(n):"}], "An analyst gathers the following information (in $ millions) about three companies: Item | Company 1 | Company 2 | Company 3; Cash | 2.5 | 2.0 | 1.5; Short-term marketable instruments | 4.0 | 1.0 | 1.0; Receivables | 2.0 | 2.0 | 1.0; Inventory | 1.0 | 1.0 | 3.0; Current liabilities | 5.0 | 2.5 | 2.0; Based on the quick ratio, which company exhibits the lowest liquidity risk?": [{"type": "text", "text": "An analyst gathers the following information (in $ millions) about three companies:"}, {"type": "table", "headers": ["Item", "Company 1", "Company 2", "Company 3"], "rows": [["Cash", "2.5", "2.0", "1.5"], ["Short-term marketable instruments", "4.0", "1.0", "1.0"], ["Receivables", "2.0", "2.0", "1.0"], ["Inventory", "1.0", "1.0", "3.0"], ["Current liabilities", "5.0", "2.5", "2.0"]]}, {"type": "text", "text": "Based on the quick ratio, which company exhibits the lowest liquidity risk?"}], "An analyst is comparing the solvency of a company over the past two years using the information below: Year 2 | ¥ Millions; Total debt | 2,300; Total shareholders' equity | 17,000; Total assets | 20,000; Net income | 375; Interest payments/interest expense | 200; Taxes paid | 125; Ratios in Year 1 Debt to capital | 12.7%; Interest coverage | 2.9; The best conclusion the analyst can make about Year 2 is that compared with Year 1, the company's solvency has:": [{"type": "text", "text": "An analyst is comparing the solvency of a company over the past two years using the information below:"}, {"type": "table", "headers": ["Year 2", "¥ millions"], "rows": [["Total debt", "2,300"], ["Total shareholders' equity", "17,000"], ["Total assets", "20,000"], ["Net income", "375"], ["Interest payments/interest expense", "200"], ["Taxes paid", "125"]]}, {"type": "table", "headers": ["Ratios in Year 1", "Value"], "rows": [["Debt to capital", "12.7%"], ["Interest coverage", "2.9"]]}, {"type": "text", "text": "The best conclusion the analyst can make about Year 2 is that compared with Year 1, the company's solvency has:"}], "An analyst gathers the following year-end prices for a non-dividend-paying stock that was purchased at the end of Year 1 and sold at the end of Year 3: Year | Price; 1 | €6; 2 | €10; 3 | €12; Which of the following returns is the largest?": [{"type": "text", "text": "An analyst gathers the following year-end prices for a non-dividend-paying stock that was purchased at the end of Year 1 and sold at the end of Year 3:"}, {"type": "table", "headers": ["Year", "Price"], "rows": [["1", "€6"], ["2", "€10"], ["3", "€12"]]}, {"type": "text", "text": "Which of the following returns is the largest?"}], "An analyst gathers the following annual returns on a stock: Year | Return; 1 | 5%; 2 | -2%; 3 | 3%; 4 | 8%; If the annual target return is 4%, the sample target semideviation of returns is closest to:": [{"type": "text", "text": "An analyst gathers the following annual returns on a stock:"}, {"type": "table", "headers": ["Year", "Return"], "rows": [["1", "5%"], ["2", "−2%"], ["3", "3%"], ["4", "8%"]]}, {"type": "text", "text": "If the annual target return is 4%, the sample target semideviation of returns is closest to:"}], "An analyst estimates the following risk premiums for a long-term corporate bond: Inflation premium 1.5% Default risk premium 2.0% Liquidity premium 1.0% Maturity premium 1.5% If the short-term nominal risk-free interest rate is 4.0%, the yield on the bond is closest to:": [{"type": "text", "text": "An analyst estimates the following risk premiums for a long-term corporate bond:"}, {"type": "table", "headers": ["Risk premium", "Value"], "rows": [["Inflation premium", "1.5%"], ["Default risk premium", "2.0%"], ["Liquidity premium", "1.0%"], ["Maturity premium", "1.5%"]]}, {"type": "text", "text": "If the short-term nominal risk-free interest rate is 4.0%, the yield on the bond is closest to:"}], "Because of significant changes in the marketplace, the demand for a company's product has fallen and is not expected to recover to previous levels. The following information is related to the patent under which the product is produced: Item Description | $ thousands; Carrying value amount | 36,000; Undiscounted expected future cash flows | 38,000; Present value of expected future cash flows | 32,000; Fair value if sold | 34,000; Costs to sell | 4,000; Which of the following statements is most accurate? The patent is impaired under:": [{"type": "text", "text": "Because of significant changes in the marketplace, the demand for a company's product has fallen and is not expected to recover to previous levels. The following information is related to the patent under which the product is produced:"}, {"type": "table", "headers": ["Item Description", "$ thousands"], "rows": [["Carrying value amount", "36,000"], ["Undiscounted expected future cash flows", "38,000"], ["Present value of expected future cash flows", "32,000"], ["Fair value if sold", "34,000"], ["Costs to sell", "4,000"]]}, {"type": "text", "text": "Which of the following statements is most accurate? The patent is impaired under:"}]};
  const fmt=s=>`${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s%3600/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  function validateContent(content){
    if(content===undefined)return undefined;
    if(!Array.isArray(content)||!content.length)throw Error('Nội dung câu hỏi không hợp lệ.');
    return content.map(block=>{
      if(block.type==='text'&&typeof block.text==='string')return {type:'text',text:block.text};
      if(block.type==='table'&&Array.isArray(block.headers)&&block.headers.length&&block.headers.every(x=>typeof x==='string')&&Array.isArray(block.rows)&&block.rows.length&&block.rows.every(row=>Array.isArray(row)&&row.length===block.headers.length&&row.every(x=>typeof x==='string'||typeof x==='number')))return {type:'table',headers:block.headers,rows:block.rows};
      throw Error('Bảng trong câu hỏi có hàng/cột không hợp lệ.');
    });
  }
function inferPipeContent(stem){
    const parts=String(stem||'').split(/\s*(?:;|\r?\n)\s*/).map(x=>x.trim()).filter(Boolean),blocks=[],text=[];let rows=[];
    const flushTable=()=>{if(rows.length>=2){blocks.push({type:'table',headers:rows[0],rows:rows.slice(1)});rows=[]}};
    const flushText=()=>{if(text.length){blocks.push({type:'text',text:text.join(' ')});text.length=0}};
    for(const part of parts){const cells=part.split('|').map(x=>x.trim());if(cells.length>=2&&cells.every(Boolean)){rows.push(cells)}else{flushTable();text.push(part)}}
    flushTable();flushText();return blocks.some(b=>b.type==='table')?blocks:undefined;
  }
function richText(value){let s=escapeText(String(value??''));s=s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,'<span class="math-frac"><span>$1</span><span>$2</span></span>');s=s.replace(/([A-Za-zΑ-Ωα-ω0-9])_([A-Za-z0-9+-]+)/g,'$1<sub>$2</sub>');s=s.replace(/([A-Za-zΑ-Ωα-ω0-9])\^([A-Za-z0-9+-]+)/g,'$1<sup>$2</sup>');return s}
  function renderQuestionContent(q){
    const host=$('mockRoomStem');host.replaceChildren();host.classList.remove('is-highlighted');$('mockRoomNote')?.classList.remove('is-highlighted');
    const blocks=q.content||legacyTableContent[q.stem]||inferPipeContent(q.stem)||[{type:'text',text:q.stem}];
    for(const block of blocks){
      if(block.type==='text'){const p=document.createElement('p');p.className='mock-rich-text';p.style.whiteSpace='pre-line';p.innerHTML=richText(String(block.text||'').replace(/([•*·●▪])\s*/g,'\n$1 '));host.append(p);continue}
      const wrap=document.createElement('div'),table=document.createElement('table'),head=document.createElement('thead'),body=document.createElement('tbody'),tr=document.createElement('tr');
      wrap.className='mock-question-table-scroll';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Bảng dữ liệu câu '+(current+1));
      block.headers.forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;tr.append(th)});head.append(tr);
      block.rows.forEach(row=>{const tr=document.createElement('tr');row.forEach((text,i)=>{const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=text;tr.append(cell)});body.append(tr)});
      table.append(head,body);wrap.append(table);host.append(wrap);
    }
  }
  function render(){
    const q=demo[current];if(!q)return;const submitted=isResultMode();dialog.dataset.resultMode=String(submitted);$('mockRoomNext').disabled=false;$('mockRoomSubmit').disabled=!!submitted;$('mockRoomClear').disabled=!!submitted;$('mockRoomFlag').disabled=!!submitted;
    $('mockRoomCounter').textContent=`Câu ${current+1}/${demo.length}`;$('mockRoomQuestionNo').textContent=current+1;$('mockRoomTopic').textContent=topicLabel(q);renderQuestionContent(q);$('mockRoomQuestionTime').textContent='◷ 01:58';$('mockRoomClock').textContent=fmt(seconds);$('mockRoomAnswered').textContent=`Đã trả lời ${Object.keys(answers).length}/${demo.length}`;$('mockRoomTitle').textContent=bankTitle;
    $('mockRoomPrev').disabled=current===0;$('mockRoomPrev').innerHTML=document.body.dataset.language==='en'?'‹&nbsp; Previous question':'‹&nbsp; Câu trước';$('mockRoomNext').textContent=current===demo.length-1?(document.body.dataset.language==='en'?'Review ›':'Xem lại ›'):(document.body.dataset.language==='en'?'Next question ›':'Câu sau ›');$('mockRoomFlag').classList.toggle('is-flagged',flags.has(current));
    $('mockRoomOptions').replaceChildren(...q.options.map((o,i)=>{const button=document.createElement('button'),label=document.createElement('b'),text=document.createElement('span');const isCorrect=submitted&&q.correctAnswer!==undefined&&(typeof q.correctAnswer==='number'?i===q.correctAnswer:o.label===String(q.correctAnswer).toUpperCase()),isWrong=submitted&&answers[current]===i&&!isCorrect;button.className='mock-room-option'+(answers[current]===i?' is-selected':'')+(isCorrect?' is-correct':'')+(isWrong?' is-wrong':'');button.disabled=!!submitted;button.dataset.answer=i;label.textContent=String.fromCharCode(65+i);text.className='mock-rich-text';text.innerHTML=richText(typeof o==='string'?o:o.text);button.append(label,text);return button}));
    $('mockRoomOptions').querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{answers[current]=Number(b.dataset.answer);render()});
    saveAttempt();
    $('mockRoomNav').innerHTML=demo.map((_,i)=>`<button class="mock-room-nav-item${i===current?' is-current':''}${answers[i]!==undefined?' is-answered':''}${flags.has(i)?' is-flagged':''}${mistakeQuestions.has(i)?' is-review':''}" data-q="${i}">${i+1}</button>`).join('');$('mockRoomNav').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{current=Number(b.dataset.q);isResultMode()?showResult():render()});
  }

  const libraryKey='charterprep.mockLibrary.v2';
  let library=[],activeId=null,historyView=null;
  const isResultMode=()=>!!historyView||library.find(e=>e.id===activeId)?.status==='submitted';
  const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Keep subject metadata explicit: wording in a question is not a reliable subject label.
  const topicDefinitions=[
    ['Ethical and Professional Standards','ethics','ethical standards','professional standards','đạo đức'],
    ['Quantitative Methods','quant','quantitative','quants','qm','phương pháp định lượng','định lượng'],
    ['Economics','econ','kinh tế','kinh tế học'],
    ['Financial Statement Analysis','fsa','fra','financial reporting and analysis','financial reporting & analysis','phân tích báo cáo tài chính'],
    ['Corporate Issuers','corporate finance','corporate','ci','tài chính doanh nghiệp','tổ chức phát hành'],
    ['Equity Investments','equity','equities','eq','cổ phiếu'],
    ['Fixed Income','fixed-income','fi','thu nhập cố định','trái phiếu'],
    ['Derivatives','derivative','phái sinh'],
    ['Alternative Investments','alternatives','alternative','ai','đầu tư thay thế'],
    ['Portfolio Management','portfolio','pm','quản lý danh mục','quản lý danh mục đầu tư']
  ];
  const topicKey=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
  const topicAliases=new Map(topicDefinitions.flatMap(([name,...aliases])=>[name,...aliases].map(alias=>[topicKey(alias),name])));
  const missingTopics=new Set(['','general','generall','unknown','unspecified','unassigned','n a','none','null','chua phan mon','chua xac dinh','mixed','all','tat ca']);
  function normalizeTopic(value){
    if(value&&typeof value==='object')value=value.name??value.label??value.title??value.code;
    if(typeof value!=='string')return '';
    const label=value.trim(),key=topicKey(label);
    return missingTopics.has(key)?'':topicAliases.get(key)||label;
  }
  function topicCandidates(record,heading=false){
    if(typeof record==='string')return [normalizeTopic(record)].filter(Boolean);
    if(!record||typeof record!=='object')return [];
    const fields=['subject','subjectName','topic','topicName','category'];
    if(heading)fields.push('name','title','label');
    return fields.map(k=>normalizeTopic(record[k])).concat(record.metadata?topicCandidates(record.metadata):[]).filter(Boolean);
  }
  function resolveTopic(question,section,bank,meta={}){
    const candidates=[...topicCandidates(question),...topicCandidates(question.section,true),...topicCandidates(section,true),...topicCandidates(bank),normalizeTopic(meta.subject)].filter(Boolean);
    // A chapter title (e.g. Inventory) must not mask an explicit CFA subject.
    return candidates.find(t=>topicAliases.has(topicKey(t)))||candidates[0]||'';
  }
  const topicLabel=q=>(q.topicSource==='manual'?normalizeTopic(q.topic):resolveTopic(q))||'Chưa phân môn';
  function importQuestionRows(bank){
    const sections=Array.isArray(bank.sections)?bank.sections:[];
    if(Array.isArray(bank.questions)&&bank.questions.length)return bank.questions.map((question,i)=>{
      if(!question||typeof question!=='object')return {question};
      const ref=question.sectionId??(typeof question.section==='object'?question.section?.id:question.section);
      const section=sections.find(s=>ref!==undefined&&[s.id,s.name,s.title].some(x=>x!==undefined&&String(x)===String(ref)))||sections.find(s=>Number.isInteger(s.startQuestion)&&Number.isInteger(s.endQuestion)&&i+1>=s.startQuestion&&i+1<=s.endQuestion);
      return {question,section};
    });
    return sections.flatMap(section=>Array.isArray(section.questions)?section.questions.map(question=>({question,section})):[]);
  }
  const topicDialog=document.createElement('dialog');topicDialog.id='mockTopicDialog';topicDialog.className='mock-topic-dialog';topicDialog.setAttribute('aria-labelledby','mockTopicTitle');topicDialog.setAttribute('translate','no');
  topicDialog.innerHTML='<form method="dialog"><header><div><small data-topic-copy="eyebrow"></small><h2 id="mockTopicTitle" data-topic-copy="title"></h2></div><button type="button" id="mockTopicClose" aria-label="Close">×</button></header><p id="mockTopicBank"></p><p data-topic-copy="hint"></p><div class="mock-topic-bulk"><label><span data-topic-copy="from"></span><input id="mockTopicFrom" type="number" min="1" value="1" required></label><label><span data-topic-copy="to"></span><input id="mockTopicTo" type="number" min="1" value="1" required></label><label><span data-topic-copy="subject"></span><select id="mockTopicBulkSubject"></select></label><button type="button" class="btn ghost" id="mockTopicApply" data-topic-copy="assign"></button></div><p id="mockTopicCount" role="status"></p><div class="mock-topic-rows" id="mockTopicRows"></div><footer><span id="mockTopicError" role="alert"></span><button type="button" class="btn ghost" id="mockTopicCancel" data-topic-copy="cancel"></button><button type="button" class="btn" id="mockTopicSave" data-topic-copy="save"></button></footer></form>';
  document.body.append(topicDialog);
  let topicDraft=null;
  const topicCopy=()=>document.body.dataset.language==='en'?{eyebrow:'QUESTION SUBJECTS',title:'Assign subjects',hint:'Use the subject headings in your exam. Assign a range, or edit individual questions. Your answers and time are kept.',from:'From question',to:'To question',subject:'Subject',assign:'Apply to range',cancel:'Cancel',save:'Save subjects',unassigned:'Unassigned',manage:'Assign subjects',count:n=>n?'Unassigned: '+n+' questions':'All questions have a subject'}:{eyebrow:'PHÂN MÔN CHO ĐỀ',title:'Phân môn câu hỏi',hint:'Dựa theo tiêu đề môn trong đề gốc. Gán theo khoảng câu hoặc sửa từng câu. Đáp án và thời gian làm bài được giữ nguyên.',from:'Từ câu',to:'Đến câu',subject:'Môn học',assign:'Gán cho khoảng câu',cancel:'Hủy',save:'Lưu phân môn',unassigned:'Chưa phân môn',manage:'Phân môn',count:n=>n?'Còn '+n+' câu chưa phân môn':'Tất cả câu đã có môn'};
  function topicOptions(value=''){
    const names=topicDefinitions.map(x=>x[0]);if(value&&!names.includes(value))names.push(value);
    return '<option value="">'+topicCopy().unassigned+'</option>'+names.map(t=>'<option value="'+escapeText(t)+'"'+(t===value?' selected':'')+'>'+escapeText(t)+'</option>').join('');
  }
  function updateTopicCount(){if(topicDraft){const el=$('mockTopicCount'),label=topicCopy().count(topicDraft.topics.filter(t=>!t).length);if(el.textContent!==label)el.textContent=label}}
  function localizeTopics(){
    const copy=topicCopy();topicDialog.querySelectorAll('[data-topic-copy]').forEach(el=>{const label=copy[el.dataset.topicCopy];if(el.textContent!==label)el.textContent=label});
    document.querySelectorAll('[data-manage-topics]').forEach(b=>{const n=Number(b.dataset.unassigned),label=copy.manage+(n?' · '+n+' '+copy.unassigned.toLowerCase():'');if(b.textContent!==label)b.textContent=label});
    topicDialog.querySelectorAll('option[value=""]').forEach(el=>{if(el.textContent!==copy.unassigned)el.textContent=copy.unassigned});updateTopicCount();
  }
  window.MockRoomTopics={localize:localizeTopics};
  const topicHint=document.createElement('p');topicHint.className='mock-import-hint';topicHint.textContent='Môn học được đọc từ từng câu hoặc từng nhóm câu trong JSON. Câu thiếu môn có thể bổ sung bằng nút Phân môn sau khi nhập.';importDialog.querySelector('.mock-import-actions').before(topicHint);
  const subjectList=document.createElement('datalist');subjectList.id='mockSubjectNames';subjectList.innerHTML=topicDefinitions.map(([name])=>'<option value="'+escapeText(name)+'"></option>').join('');importDialog.append(subjectList);$('practiceSubject').setAttribute('list',subjectList.id);
  $('mockRoomTopic').setAttribute('translate','no');
  function openTopicEditor(id){
    const entry=library.find(e=>e.id===id);if(!entry)return;
    topicDraft={id,topics:entry.questions.map(q=>normalizeTopic(topicLabel(q)))};
    $('mockTopicBank').textContent=entry.title;$('mockTopicError').textContent='';
    $('mockTopicFrom').value=1;$('mockTopicTo').value=entry.questions.length;
    for(const id of ['mockTopicFrom','mockTopicTo'])$(id).max=entry.questions.length;
    $('mockTopicBulkSubject').innerHTML=topicOptions();
    $('mockTopicRows').replaceChildren(...entry.questions.map((q,i)=>{
      const row=document.createElement('label');row.className='mock-topic-row';
      const number=document.createElement('b');number.textContent=String(i+1);
      const stem=document.createElement('span');stem.textContent=String(q.stem||'');
      const select=document.createElement('select');select.dataset.topicIndex=i;select.setAttribute('aria-label','Subject · '+(i+1));select.innerHTML=topicOptions(topicDraft.topics[i]);
      select.onchange=()=>{topicDraft.topics[i]=select.value;updateTopicCount()};row.append(number,stem,select);return row;
    }));localizeTopics();topicDialog.showModal();
  }
  for(const id of ['mockTopicClose','mockTopicCancel'])$(id).onclick=()=>topicDialog.close();
  $('mockTopicApply').onclick=()=>{
    if(!topicDialog.querySelector('form').reportValidity())return;
    const from=Number($('mockTopicFrom').value),to=Number($('mockTopicTo').value);
    if(!topicDraft||from>to){$('mockTopicError').textContent=document.body.dataset.language==='en'?'The last question must follow the first.':'Câu cuối phải lớn hơn hoặc bằng câu đầu.';return}
    $('mockTopicError').textContent='';
    for(let i=from-1;i<to;i++){topicDraft.topics[i]=$('mockTopicBulkSubject').value;$('mockTopicRows').querySelector('[data-topic-index="'+i+'"]').value=topicDraft.topics[i]}updateTopicCount();
  };
  $('mockTopicSave').onclick=()=>{
    if(!topicDraft)return;
    try{
      const updated=library.map(e=>e.id===topicDraft.id?results.reclassify(e,e.questions.map((q,i)=>({...q,topic:topicDraft.topics[i]||'GENERAL',topicSource:'manual'}))):e);
      commit(updated);if(activeId===topicDraft.id)demo=library.find(e=>e.id===activeId).questions;
      topicDialog.close();renderCatalog();report(document.body.dataset.language==='en'?'Subjects saved. Answers and exam progress are unchanged.':'Đã lưu phân môn. Đáp án và tiến độ làm bài được giữ nguyên.');
    }catch{$('mockTopicError').textContent='Không lưu được. Hãy kiểm tra dung lượng lưu trữ.'}
  };
  const notice=document.createElement('p');notice.id='mockCatalogNotice';notice.setAttribute('role','status');catalog.querySelector('.mock-catalog-head').after(notice);
  const report=(message,error=false)=>{notice.textContent=message;notice.style.color=error?'#b42318':'#167249'};
  function commit(next){localStorage.setItem(libraryKey,JSON.stringify(next));library=next}
const isCorrectAnswer=(q,selected)=>q?.correctAnswer!==undefined&&q?.correctAnswer!==null&&(typeof q.correctAnswer==='number'?Number(selected)===q.correctAnswer:q.options?.[selected]?.label===String(q.correctAnswer).toUpperCase());
  const results=window.createMockResults({panel:reviewPanel,getLibrary:()=>library,getTopic:topicLabel,onView:openPastAttempt,onReview:startReviewAttempt,onTopics:openTopicEditor,onDelete:deleteResultAttempts});
  function deleteResultAttempts(rows){
    if(!rows.length)return;
    const en=document.body.dataset.language==='en',titles=[...new Set(rows.map(r=>r.entry.title))];
    const scope=rows.length===1?rows[0].entry.title+' · '+(en?'Attempt ':'Lượt ')+(rows[0].index+1):rows.length+(en?' attempts across ':' lượt thuộc ')+titles.length+(en?' exam(s)':' bộ đề');
    if(!confirm((en?'Delete ':'Xoá ')+scope+'?\n\n'+(en?'These scores and saved answers will be removed. Exam questions and any unfinished attempt are kept.':'Điểm và đáp án của các lượt này sẽ được xoá. Bộ đề và bài đang làm dở được giữ nguyên.')))return;
    const targets=new Map();rows.forEach(r=>{if(!targets.has(r.entry.id))targets.set(r.entry.id,new Set());targets.get(r.entry.id).add(r.h.id)});
    try{
      const next=library.map(e=>targets.has(e.id)?results.removeAttempts(e,targets.get(e.id)):e);
      commit(next);
      if(activeId&&targets.has(activeId)&&((historyView&&targets.get(activeId).has(historyView.record.id))||next.find(e=>e.id===activeId)?.status==='todo')){
        clearInterval(timer);activeId=null;historyView=null;answers={};flags.clear();mistakeQuestions.clear();if(dialog.open)dialog.close();
      }
      renderCatalog();report(en?'Results deleted. Exam question banks are kept.':'Đã xoá kết quả đã chọn. Bộ đề vẫn được giữ nguyên.');
    }catch{report(en?'Could not save the change. No results were deleted.':'Chưa lưu được thay đổi. Kết quả chưa bị xoá.',true)}
  }
  window.MockRoomAnalytics={localize:results.localize};
  function openPastAttempt(entry,record){
    const questions=results.questionsFor(entry,record);if(!questions)return;
    clearInterval(timer);historyView={entry,record};activeId=entry.id;
    demo=JSON.parse(JSON.stringify(questions));bankTitle=entry.title+' · '+(document.body.dataset.language==='en'?'Attempt':'Lượt')+' '+((entry.history||[]).findIndex(h=>h.id===record.id)+1);
    answers={...record.answers};flags=new Set(record.flags||[]);current=0;seconds=record.seconds??0;
    render();dialog.showModal();showResult();window.CharterI18n?.apply(document.body.dataset.language||'vi');
  }
  function startReviewAttempt(entry,record){
    const questions=results.questionsFor(entry,record);if(!questions)return;
    createIncorrectReview(entry,questions,record.answers||{},record.id);
  }
  function renderCatalog(){
    const query=$('mockCatalogSearch').value.trim().toLowerCase();
    catalog.querySelectorAll('[data-catalog-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.catalogTab===catalogTab);b.querySelector('span').textContent=library.filter(e=>b.dataset.catalogTab==='all'||e.status===b.dataset.catalogTab).length});
    const topics=[...new Set(library.flatMap(e=>e.questions.map(topicLabel)))].sort();
    $('mockCatalogTopic').innerHTML='<option value="all">Tất cả chủ đề</option>'+topics.map(t=>'<option value="'+escapeText(t)+'">'+escapeText(t)+'</option>').join('');
    if(!topics.includes(catalogTopic))catalogTopic='all';$('mockCatalogTopic').value=catalogTopic;
    let entries=library.filter(e=>e.title.toLowerCase().includes(query)&&(catalogTab==='all'||e.status===catalogTab)&&(catalogTopic==='all'||e.questions.some(q=>topicLabel(q)===catalogTopic)));
    if(catalogSort==='name')entries.sort((a,b)=>a.title.localeCompare(b.title));if(catalogSort==='duration')entries.sort((a,b)=>a.durationMinutes-b.durationMinutes);
    $('mockCatalogCount').textContent=entries.length+' đề';$('mockCatalogGrid').classList.toggle('is-list',!catalogGrid);results.render();
    $('mockCatalogGrid').innerHTML=entries.map(e=>'<article class="mock-exam-card is-imported"><div class="mock-exam-card-top"><span class="mock-exam-icon">▤</span><span class="mock-exam-pill">'+({todo:'Chưa làm',progress:'Đang làm dở',submitted:'Đã nộp'}[e.status])+'</span><button class="mock-exam-delete" data-delete="'+escapeText(e.id)+'" aria-label="Xoá '+escapeText(e.title)+'">×</button></div><h2>'+escapeText(e.title)+'</h2><div class="mock-exam-meta"><span>'+e.questions.length+' câu</span><span>◷ '+e.durationMinutes+' phút</span></div><div class="mock-exam-divider"></div><p>'+({todo:'Sẵn sàng bắt đầu',progress:'Đã trả lời '+Object.keys(e.attempt?.answers||{}).length+'/'+e.questions.length,submitted:'Đã hoàn thành bài thi'}[e.status])+'</p><button class="mock-exam-action primary" data-open="'+escapeText(e.id)+'">'+({todo:'Bắt đầu',progress:'Làm tiếp',submitted:'Xem kết quả'}[e.status])+'</button></article>').join('')||'<div class="mock-catalog-empty">'+(library.length?'Không có đề phù hợp với bộ lọc.':'Chưa có đề thi. Bấm “Thêm đề JSON” để thêm đề của bạn.')+'</div>';
    catalog.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openBank(b.dataset.open));catalog.querySelectorAll('[data-open]').forEach(b=>{const entry=library.find(e=>e.id===b.dataset.open);if(entry?.status==='submitted'&&!entry.reviewOf){const rb=document.createElement('button');rb.className='mock-exam-action mock-review-open';rb.textContent='Review incorrect';rb.onclick=()=>startIncorrectReview(entry.id);b.after(rb)}});
    catalog.querySelectorAll('[data-open]').forEach(b=>{
      const entry=library.find(e=>e.id===b.dataset.open),manage=document.createElement('button');
      manage.type='button';manage.className='mock-topic-manage';manage.dataset.manageTopics=entry.id;
      manage.dataset.unassigned=entry.questions.filter(q=>!normalizeTopic(topicLabel(q))).length;
      manage.setAttribute('translate','no');manage.onclick=()=>openTopicEditor(entry.id);b.closest('article').append(manage);
    });localizeTopics();
    catalog.querySelectorAll('[data-open]').forEach(button=>{
      const entry=library.find(e=>e.id===button.dataset.open);if(entry.status==='todo')return;
      const actions=document.createElement('div'),reset=document.createElement('button');
      actions.className='mock-exam-card-actions';button.before(actions);actions.append(button);
      reset.type='button';reset.className='mock-exam-action mock-exam-reset';reset.dataset.reset=entry.id;reset.textContent='↶ Làm lại';reset.setAttribute('aria-label','Làm lại '+entry.title);
      reset.onclick=()=>resetBank(entry.id);actions.append(reset);
    });
    catalog.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const entry=library.find(e=>e.id===b.dataset.delete);if(!confirm('Xoá “'+entry.title+'” và toàn bộ lịch sử làm bài của đề này?'))return;try{commit(library.filter(e=>e.id!==entry.id));if(activeId===entry.id){activeId=null;clearInterval(timer);dialog.close()}renderCatalog();report('Đã xoá '+entry.title)}catch{report('Chưa xoá được vì không thể lưu dữ liệu. Hãy thử lại.',true)}});
  }
  function saveAttempt(){if(!activeId||isResultMode())return;const next=library.map(e=>e.id===activeId?{...e,status:e.status==='submitted'?'submitted':'progress',attempt:{answers:{...answers},flags:[...flags],current,seconds}}:e);try{commit(next)}catch{report('Không lưu được bài làm. Hãy kiểm tra dung lượng lưu trữ.',true)}}
  function resetBank(id){
    const entry=library.find(e=>e.id===id);if(!entry)return;
    if(!confirm('Làm lại “'+entry.title+'”? Bài làm mới sẽ bắt đầu với đáp án trống. Kết quả các lượt đã nộp vẫn được giữ. Thời gian sẽ trở về '+entry.durationMinutes+' phút. Nội dung đề vẫn được giữ nguyên.'))return;
    try{
      commit(library.map(e=>{if(e.id!==id)return e;const {attempt,lastSubmittedAttemptId,...rest}=results.archive(e);return {...rest,status:'todo'}}));
      if(activeId===id){clearInterval(timer);activeId=null;historyView=null;answers={};flags.clear();current=0;seconds=entry.durationMinutes*60;if(dialog.open)dialog.close()}
      renderCatalog();report('Đã đặt lại '+entry.title+'. Chọn tab Chưa làm → Bắt đầu để làm bài mới.');
    }catch{report('Chưa đặt lại được vì không thể lưu dữ liệu. Bài làm cũ vẫn được giữ.',true)}
  }
  function openBank(id){historyView=null;const e=library.find(e=>e.id===id);if(!e)return;activeId=id;demo=e.questions;bankTitle=e.title;current=e.attempt?.current||0;answers={...e.attempt?.answers};flags=new Set(e.attempt?.flags||[]);if(e.status!=='submitted')mistakeQuestions.clear();seconds=e.attempt?.seconds??e.durationMinutes*60;clearInterval(timer);render();dialog.showModal();window.CharterI18n?.apply(document.body.dataset.language||'vi');if(e.status==='submitted'){showResult();return}saveAttempt();renderCatalog();timer=setInterval(()=>{seconds=Math.max(0,seconds-1);$('mockRoomClock').textContent=fmt(seconds);if(seconds%15===0)saveAttempt();if(!seconds)submitBank(false)},1000)}
  function showResult(){
    const q=demo[current];if(!q)return;
    const score=results.summarize(demo,answers),en=document.body.dataset.language==='en';
    dialog.dataset.resultMode='true';
    mistakeQuestions=new Set(demo.flatMap((q,i)=>results.hasKey(q)&&!results.correct(q,answers[i])?[i]:[]));
    $('mockRoomTopic').textContent=topicLabel(q);$('mockRoomQuestionNo').textContent=current+1;
    $('mockRoomCounter').textContent=(en?'Question ':'Câu ')+(current+1)+'/'+demo.length;
    $('mockRoomAnswered').textContent=score.gradedTotal?score.score+'/'+score.gradedTotal+(en?' correct':' đúng')+' · '+Number((score.score/score.gradedTotal*100).toFixed(1))+'%':(en?'No answer key':'Chưa có đáp án để chấm');
    $('mockRoomTitle').textContent=bankTitle;
    $('mockRoomPrev').disabled=current===0;$('mockRoomNext').disabled=current===demo.length-1;
    $('mockRoomSubmit').disabled=true;$('mockRoomClear').disabled=true;$('mockRoomFlag').disabled=true;
    const legend=dialog.querySelector('.mock-room-legend');if(legend)legend.textContent=en?'Green: correct · Red: wrong / blank':'Xanh: đúng · Đỏ: sai / bỏ trống';
    renderQuestionContent(q);
    $('mockRoomNav').innerHTML=demo.map((question,i)=>'<button class="mock-room-nav-item'+(i===current?' is-current':'')+(results.correct(question,answers[i])?' is-answered':'')+(flags.has(i)?' is-flagged':'')+(mistakeQuestions.has(i)?' is-review':'')+'" data-q="'+i+'">'+(i+1)+'</button>').join('');
    $('mockRoomNav').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{current=Number(b.dataset.q);showResult()});
    if(q.explanation){
      const explanation=document.createElement('div');explanation.className='mock-answer-explanation';
      const chunks=richText(String(q.explanation)).replace(/WACC\s*=\s*w\s+r\s+\(1\s+[–-]\s*t\)\s+\+\s+w\s+r\s+\+\s+w\s+r\s+d\s+d\s+p\s+p\s+e\s+e/i,'WACC = w<sub>d</sub>r<sub>d</sub> (1 − t<sub>d</sub>) + w<sub>p</sub>r<sub>p</sub> + w<sub>e</sub>r<sub>e</sub>').split(/\s+(?=[A-C]\.)/).filter(Boolean);
      explanation.innerHTML='<strong>'+(en?'Explanation':'Giải thích')+'</strong>'+chunks.map(chunk=>'<p class="explanation-part"><b>'+((chunk.match(/^[A-C]\./)||[''])[0]).replace('.','')+'</b> '+chunk.replace(/^[A-C]\.\s*/,'').replace(/([•*·●▪])\s*/g,'<br>$1 ')+'</p>').join('');
      $('mockRoomStem').append(explanation);
    }
    $('mockRoomOptions').replaceChildren(...q.options.map((o,i)=>{
      const b=document.createElement('button'),correct=results.correct(q,i),wrong=results.hasKey(q)&&answers[current]===i&&!correct;
      b.className='mock-room-option'+(answers[current]===i?' is-selected':'')+(correct?' is-correct':'')+(wrong?' is-wrong':'');b.disabled=true;
      b.innerHTML='<b>'+String.fromCharCode(65+i)+'</b><span>'+richText(typeof o==='string'?o:o.text)+'</span>';return b;
    }));
  }
  function createIncorrectReview(source,questions,submittedAnswers,reviewAttemptId=null){
    const wrong=questions.filter((q,i)=>results.hasKey(q)&&!results.correct(q,submittedAnswers[i]));
    if(!wrong.length)return;
    const duration=Math.max(5,Math.ceil((source.durationMinutes||30)*wrong.length/questions.length));
    const entry={id:'review-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),title:'Review Incorrect · '+source.title,type:'review',questions:wrong.map((q,i)=>({...q,number:i+1})),durationMinutes:duration,status:'todo',reviewOf:source.id,reviewAttemptId};
    commit([...library,entry]);renderCatalog();openBank(entry.id);
  }
  function startIncorrectReview(sourceId){const source=library.find(e=>e.id===sourceId);if(source?.attempt)createIncorrectReview(source,source.questions,source.attempt.answers||{},source.lastSubmittedAttemptId)}
  function submitBank(ask=true){
    if(!activeId||isResultMode())return;
    const remaining=demo.filter((q,i)=>!Number.isInteger(answers[i])).length;
    if(ask&&seconds>0&&!confirm(remaining?'Bạn còn '+remaining+' câu chưa trả lời. Bạn có chắc muốn nộp bài không?':'Bạn đã trả lời hết tất cả câu hỏi. Bạn có chắc chắn muốn nộp bài không?'))return;
    const completed=library.find(e=>e.id===activeId);if(!completed)return;
    try{
      const entry=results.submit({...completed,attempt:{answers:{...answers},flags:[...flags],current,seconds}});
      commit(library.map(e=>e.id===entry.id?entry:e));clearInterval(timer);renderCatalog();showResult();
      $('mockRoomClear').disabled=true;$('mockRoomFlag').disabled=true;
    }catch{report('Chưa lưu được kết quả. Hãy kiểm tra dung lượng lưu trữ rồi thử lại.',true);if(!seconds)clearInterval(timer)}
  }

  $('mockCatalogSearch').oninput=renderCatalog;catalog.querySelectorAll('[data-catalog-tab]').forEach(b=>b.onclick=()=>{catalogTab=b.dataset.catalogTab;catalog.querySelectorAll('[data-catalog-tab]').forEach(x=>x.classList.toggle('active',x===b));renderCatalog()});$('mockCatalogFilterBtn').onclick=()=>{$('mockCatalogFilterPanel').hidden=!$('mockCatalogFilterPanel').hidden;$('mockCatalogSortPanel').hidden=true};$('mockCatalogSortBtn').onclick=()=>{$('mockCatalogSortPanel').hidden=!$('mockCatalogSortPanel').hidden;$('mockCatalogFilterPanel').hidden=true};$('mockCatalogTopic').onchange=e=>{catalogTopic=e.target.value;renderCatalog()};$('mockCatalogClearFilter').onclick=()=>{$('mockCatalogTopic').value='all';catalogTopic='all';renderCatalog()};catalog.querySelectorAll('[data-catalog-sort]').forEach(b=>b.onclick=()=>{catalogSort=b.dataset.catalogSort;$('mockCatalogSortPanel').hidden=true;renderCatalog()});$('mockCatalogListBtn').onclick=()=>{catalogGrid=false;$('mockCatalogListBtn').classList.add('active');$('mockCatalogGridBtn').classList.remove('active');renderCatalog()};$('mockCatalogGridBtn').onclick=()=>{catalogGrid=true;$('mockCatalogGridBtn').classList.add('active');$('mockCatalogListBtn').classList.remove('active');renderCatalog()};renderCatalog();

  $('mockRoomStart').onclick=()=>{if(library[0])openBank(library[0].id)};
  $('mockRoomExit').onclick=()=>{saveAttempt();clearInterval(timer);dialog.close();renderCatalog()};
  dialog.addEventListener('cancel',()=>{saveAttempt();clearInterval(timer);renderCatalog()});
  $('mockRoomPrev').onclick=()=>{if(current){current--;isResultMode()?showResult():render()}};$('mockRoomNext').onclick=()=>{if(current<demo.length-1){current++;isResultMode()?showResult():render()}else $('mockRoomSubmit').focus()};
  $('mockRoomFlag').onclick=()=>{if(isResultMode())return;flags.has(current)?flags.delete(current):flags.add(current);render()};$('mockRoomClear').onclick=()=>{if(isResultMode())return;delete answers[current];render()};$('mockRoomNote').onclick=()=>{$('mockRoomNote').classList.toggle('is-flagged')};
  $('mockRoomSubmit').onclick=()=>submitBank();
dialog.addEventListener('keydown',e=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;
    if(e.key==='ArrowLeft'){e.preventDefault();$('mockRoomPrev').click();return}
    if(e.key==='ArrowRight'){e.preventDefault();$('mockRoomNext').click();return}
    const answerIndex='abcd'.indexOf(e.key.toLowerCase());
    if(answerIndex>=0&&!$('mockRoomSubmit').disabled){const option=$('mockRoomOptions').querySelector(`[data-answer="${answerIndex}"]`);if(option){e.preventDefault();option.click()}}
  });
  window.addEventListener('pagehide',saveAttempt);
  $('mockRoomSettings').onclick=()=>{$('mockRoomSettingsPanel').hidden=!$('mockRoomSettingsPanel').hidden};
  $('mockRoomSettingsPanel').querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{dialog.dataset.fontSize=b.dataset.size;$('mockRoomSettingsPanel').querySelectorAll('[data-size]').forEach(x=>x.classList.toggle('active',x===b))});
  $('mockRoomSettingsPanel').querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{dialog.classList.toggle('mock-room-dark',b.dataset.theme==='dark');$('mockRoomSettingsPanel').querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x===b))});
  let importMeta={};
  function importBank(raw,meta=importMeta){
    const parsed=typeof raw==='string'?JSON.parse(raw):raw;
    if(!parsed||typeof parsed!=='object')throw Error('Nội dung JSON không hợp lệ.');
    const rows=importQuestionRows(parsed);
    if(!rows.length)throw Error('File cần có mảng questions hoặc sections chứa ít nhất một câu hỏi.');
    const normalized=rows.map(({question:q,section},i)=>{
      if(!q||typeof q!=='object')throw Error(`Câu ${i+1} không hợp lệ.`);
      const opts=Array.isArray(q.options)?q.options.map((o,j)=>typeof o==='string'?{label:String.fromCharCode(65+j),text:o}:o).filter(o=>o&&o.text):[];
      if(!q.stem||opts.length<2)throw Error(`Câu ${i+1} thiếu nội dung hoặc đáp án.`);
      return {number:i+1,id:q.id||`q${i+1}`,topic:resolveTopic(q,section,parsed,meta)||'GENERAL',subtopic:q.subtopic||q.learningModule||'',stem:q.stem,content:validateContent(q.content)||legacyTableContent[q.stem],options:opts.map(o=>({label:o.label||'',text:o.text})),correctAnswer:q.correctAnswer,explanation:q.explanation||''};
    });

    const title=meta.title||parsed.title||(meta.type==='practice'?`${meta.subject||'Practice'} · ${meta.issuer||'Question bank'} · ${meta.year||''}`:'CFA Mock · Imported exam');
    const existing=library.find(e=>e.title===title);
    if(existing&&!confirm('Đề “'+title+'” đã có. Thay nội dung đề và đặt lại bài làm dở? Kết quả các lượt đã nộp vẫn được giữ.'))return false;
    const previous=existing?results.archive(existing):null;
    const entry={...(previous?{history:previous.history||[],questionSets:previous.questionSets||{}}:{}),type:meta.type||parsed.type||'mock',id:existing?.id||('mock-'+Date.now()+'-'+Math.random().toString(36).slice(2)),title,questions:normalized,durationMinutes:Math.max(5,Math.min(480,Number(meta.durationMinutes)>0?Number(meta.durationMinutes):Number(parsed.durationMinutes)>0?Number(parsed.durationMinutes):135)),status:'todo'};
    commit([...library.filter(e=>e.id!==entry.id),entry]);
    activeId=null;historyView=null;demo=normalized;bankTitle=title;current=0;answers={};flags.clear();mistakeQuestions.clear();
    catalogTab='all';catalogTopic='all';$('mockCatalogSearch').value='';renderCatalog();render();
    const unassigned=normalized.filter(q=>!normalizeTopic(q.topic)).length;
    report('Đã thêm '+title+' · '+normalized.length+' câu.'+(unassigned?' Còn '+unassigned+' câu chưa phân môn. Bấm “Phân môn” trên đề để bổ sung.':' Đã nhận diện môn cho tất cả câu.'));return true;
  }
  $('practiceStart').onclick=()=>{const count=Math.max(5,Math.min(100,Number($('practiceQuestionCount').value)||20)),duration=Math.max(5,Math.min(240,Number($('practiceDuration').value)||30));const source=(library[0]?.questions?.length?library[0].questions:demo);const questions=Array.from({length:Math.min(count,source.length)},(_,i)=>({...source[i%source.length],number:i+1}));const entry={id:'practice-'+Date.now(),type:'practice',title:'Practice Test · '+questions.length+' questions',questions,durationMinutes:duration,status:'todo'};mistakeQuestions.clear();commit([...library,entry]);practiceDialog.close();renderCatalog();openBank(entry.id)};
  // Keep the file control outside a closed dialog so the browser can open it.
  document.body.append($('mockRoomImport'));
  let importType='mock';importDialog.querySelectorAll('[data-import-type]').forEach(b=>b.onclick=()=>{importType=b.dataset.importType;importDialog.querySelectorAll('[data-import-type]').forEach(x=>x.classList.toggle('active',x===b));importDialog.querySelectorAll('[data-import-fields]').forEach(x=>x.hidden=x.dataset.importFields!==importType)});$('mockImportChoose').onclick=()=>{const form=importDialog.querySelector('form');if(!form.reportValidity())return;if(importType==='practice'){const subject=$('practiceSubject').value.trim(),issuer=$('practiceIssuer').value.trim(),year=$('practiceImportYear').value;importMeta={type:'practice',subject,issuer,year,title:subject+' · '+issuer+' · '+year,durationMinutes:Number($('practiceImportDuration').value)||0}}else{const name=$('mockImportName').value.trim(),session=$('mockImportSession').value,year=$('mockImportYear').value;importMeta={type:'mock',title:name+' · Session '+session+' · '+year,durationMinutes:0}}$('mockRoomImport').click()};
  $('mockRoomImport').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(importBank(await file.text(),importMeta))importDialog.close()}catch(err){const message='Không thể thêm đề: '+err.message;report(message,true);importDialog.querySelector('.mock-import-hint').textContent=message}finally{e.target.value=''}};
  try{const stored=localStorage.getItem(libraryKey);if(stored!==null){const parsed=JSON.parse(stored);if(!Array.isArray(parsed))throw Error('Danh sách đề không hợp lệ');library=parsed}else{const old=localStorage.getItem('charterprep.mockBank');if(old){const bank=JSON.parse(old);if(!deletedCatalog.has(bank.title))importBank(bank,{})}}}catch(err){report('Chưa đọc được danh sách đề đã lưu: '+err.message,true)}
  renderCatalog();
  render();
  $('mockRoomFlag').textContent='📌';$('mockRoomFlag').setAttribute('aria-label','Ghim câu hỏi');$('mockRoomFlag').title='Ghim câu hỏi';
  let highlightMode=false;$('mockRoomNote').textContent='🖊';$('mockRoomNote').setAttribute('aria-label','Bật bút highlight');$('mockRoomNote').title='Bật bút highlight';$('mockRoomNote').onclick=()=>{highlightMode=!highlightMode;$('mockRoomNote').classList.toggle('is-highlighted',highlightMode);$('mockRoomNote').title=highlightMode?'Kéo chọn đoạn chữ để highlight':'Bật bút highlight'};$('mockRoomStem').addEventListener('mouseup',()=>{if(!highlightMode)return;const selection=window.getSelection();if(!selection||selection.isCollapsed||!$('mockRoomStem').contains(selection.anchorNode))return;const range=selection.getRangeAt(0),mark=document.createElement('mark');mark.className='mock-text-highlight';try{range.surroundContents(mark)}catch{try{document.execCommand('backColor',false,'#ffe36b')}catch{}}selection.removeAllRanges();highlightMode=false;$('mockRoomNote').classList.remove('is-highlighted')});
})();
