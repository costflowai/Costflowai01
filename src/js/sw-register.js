(function(){ 
  if(!('serviceWorker'in navigator))return; 
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js',{scope:'/'})
      .then(r => console.log('SW registered', r.scope))
      .catch(console.warn);
  });
})();
