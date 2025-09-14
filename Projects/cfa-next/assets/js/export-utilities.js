(function(){
  function toCSVRow(arr){return arr.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',');}
  function flatten(obj,prefix=''){return Object.entries(obj||{}).reduce((a,[k,v])=>{
    const key = prefix? `${prefix}.${k}`:k;
    if (v && typeof v==='object' && !Array.isArray(v)) Object.assign(a, flatten(v,key));
    else a[key]=v;
    return a;
  },{});}

  function exportToCSV(calc, filenameHint='estimate'){
    const data = flatten(calc);
    const headers = Object.keys(data);
    const row = headers.map(h=>data[h]);
    const csv = toCSVRow(headers)+'\n'+toCSVRow(row);
    try{
      const blob = new Blob([csv], {type:'text/csv'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filenameHint}-${calc.type || 'calc'}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
    }catch{ console.warn('CSV download not supported in this context'); }
    return csv;
  }

  function copyToClipboard(text){
    const s = typeof text==='string'? text : JSON.stringify(text,null,2);
    return navigator.clipboard?.writeText(s).catch(()=>{});
  }

  function showToast(msg){
    console.log('[toast]', msg);
    // (Optional) lightweight UI toast could be added later
    try{ if(document && document.body){
      const n = document.createElement('div');
      n.textContent = msg; n.style.cssText='position:fixed;right:12px;bottom:12px;background:#111;color:#fff;padding:8px 12px;border-radius:8px;z-index:9999;opacity:.95';
      document.body.appendChild(n); setTimeout(()=>n.remove(),1800);
    }}catch{}
  }

  function printSection(section){
    // Minimal: print page. (A dedicated print iframe is overkill here.)
    window.print?.();
  }

  function emailResults(calc, to){
    const subject = encodeURIComponent(`${calc.title || 'Calculator Results'} - ${calc.type}`);
    const bodyObj = {
      title: calc.title, type: calc.type, timestamp: calc.timestamp,
      inputs: calc.inputs, results: calc.results,
      link: location.href
    };
    const body = encodeURIComponent(JSON.stringify(bodyObj, null, 2));
    const href = `mailto:${to||''}?subject=${subject}&body=${body}`;
    location.href = href;
  }

  function webShare(calc){
    const text = `${calc.title || 'Results'} (${calc.type})\nTotal: ${calc.results?.totalCost ?? ''}`;
    if (navigator.share) return navigator.share({title: calc.title, text, url: location.href});
    return copyToClipboard(text).then(()=>showToast('Summary copied to clipboard'));
  }

  window.exportUtils = { exportToCSV, copyToClipboard, showToast, printSection, emailResults, webShare };
})();