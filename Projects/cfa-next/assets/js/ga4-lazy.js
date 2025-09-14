(function(){
  let gaLoaded = false;

  function loadGA4() {
    if (gaLoaded) return;
    gaLoaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  function triggerGA4Load() {
    setTimeout(loadGA4, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerGA4Load);
  } else {
    triggerGA4Load();
  }
})();