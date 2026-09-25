(function(){
  function init(){
    const en=document.querySelector('[data-lang="en"]');
    const pt=document.querySelector('[data-lang="pt"]');
    const path=window.location.pathname;
    const isEnglish=path==='/en/'||path==='/en/index.html'||path.startsWith('/en/');
    if(en){en.href=isEnglish?'https://www.hsmind.com.br/':'/en/';en.setAttribute('aria-current',isEnglish?'page':'false');}
    if(pt){pt.href=isEnglish?'https://www.hsmind.com.br/':'/';pt.setAttribute('aria-current',isEnglish?'false':'page');}
    document.documentElement.lang=isEnglish?'en':'pt-BR';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();