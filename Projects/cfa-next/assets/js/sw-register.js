(function(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', ()=> {
      navigator.serviceWorker.register('/sw.js', { scope:'/' })
        .catch(err=>console.warn('SW reg failed', err));
    });
  }
})();