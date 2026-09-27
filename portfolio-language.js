(function(){
  const map={
    "/meuportifolio/case_study_01_persona_final.html":"/meuportifolio/en/cases/case-01-virtual-assistant.html",
    "/meuportifolio/case_study_02_leadtime_final.html":"/meuportifolio/en/cases/case-02-lead-time-governance.html",
    "/meuportifolio/case_study_03_habitat_final.html":"/meuportifolio/en/cases/case-03-habitat-saas.html",
    "/meuportifolio/case_study_05_pav_receita_federal_final.html":"/meuportifolio/en/cases/case-05-pav-receita-federal.html",
    "/meuportifolio/en/cases/case-01-virtual-assistant.html":"/meuportifolio/case_study_01_persona_final.html",
    "/meuportifolio/en/cases/case-02-lead-time-governance.html":"/meuportifolio/case_study_02_leadtime_final.html",
    "/meuportifolio/en/cases/case-03-habitat-saas.html":"/meuportifolio/case_study_03_habitat_final.html",
    "/meuportifolio/en/cases/case-05-pav-receita-federal.html":"/meuportifolio/case_study_05_pav_receita_federal_final.html"
  };
  function init(){
    const en=document.querySelector('[data-lang="en"]');
    const pt=document.querySelector('[data-lang="pt"]');
    const path=window.location.pathname.replace(/\/$/,"")||"/meuportifolio";
    const isEnglish=path==="/meuportifolio/en"||path.startsWith("/meuportifolio/en/");
    const counterpart=map[path];
    if(en){en.href=counterpart&&isEnglish?counterpart:"/meuportifolio/en/";en.setAttribute("aria-current",isEnglish?"page":"false");}
    if(pt){pt.href=counterpart&&!isEnglish?counterpart:"/meuportifolio/";pt.setAttribute("aria-current",isEnglish?"false":"page");}
    document.documentElement.lang=isEnglish?"en":"pt-BR";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();