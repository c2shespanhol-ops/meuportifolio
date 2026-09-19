(function(){
  function buildEnglishUrl(){
    const u=window.location.href.split('#')[0];
    return 'https://translate.google.com/translate?sl=pt&tl=en&u='+encodeURIComponent(u);
  }
  function init(){
    const en=document.querySelector('[data-lang="en"]');
    const pt=document.querySelector('[data-lang="pt"]');
    if(en) en.href=buildEnglishUrl();
    if(pt) pt.href=window.location.href.split('#')[0];
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();