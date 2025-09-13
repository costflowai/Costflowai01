(function(){
  const host = location.hostname;
  const isProd = host === 'costflowai.com' || host.endsWith('.costflowai.com');
  if (!isProd) return; 
  if (navigator.connection?.saveData) return;
  
  function start(){
    const meta=document.querySelector('meta[name="csp-nonce"]');
    const s=document.createElement('script'); 
    s.src='https://www.googletagmanager.com/gtag/js?id=G-H7RWMCGDHG';
    if(meta) s.setAttribute('nonce', meta.content); 
    s.async=true;
    s.onload=function(){
      window.dataLayer=window.dataLayer||[]; 
      function gtag(){dataLayer.push(arguments);} 
      window.gtag=gtag;
      gtag('js', new Date()); 
      gtag('config','G-H7RWMCGDHG',{
        send_page_view:true, 
        anonymize_ip:true, 
        allow_google_signals:false, 
        transport_type:'beacon', 
        sample_rate:50
      });
    };
    document.head.appendChild(s);
  }
  
  // Load after first paint for better Core Web Vitals
  function scheduleGA() {
    if('requestIdleCallback'in window) {
      requestIdleCallback(start, {timeout: 3000}); 
    } else {
      setTimeout(start, 1000);
    }
  }
  
  if (document.readyState === 'complete') {
    scheduleGA();
  } else {
    window.addEventListener('load', scheduleGA);
  }
})();
