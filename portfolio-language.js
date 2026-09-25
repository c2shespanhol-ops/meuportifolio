(function(){
  const map={
    "/case_study_01_persona_final.html":"/en/cases/case-01-virtual-assistant.html",
    "/case_study_02_leadtime_final.html":"/en/cases/case-02-lead-time-governance.html",
    "/case_study_03_habitat_final.html":"/en/cases/case-03-habitat-saas.html",
    "/case_study_05_pav_receita_federal_final.html":"/en/cases/case-05-pav-receita-federal.html",
    "/en/cases/case-01-virtual-assistant.html":"/case_study_01_persona_final.html",
    "/en/cases/case-02-lead-time-governance.html":"/case_study_02_leadtime_final.html",
    "/en/cases/case-03-habitat-saas.html":"/case_study_03_habitat_final.html",
    "/en/cases/case-05-pav-receita-federal.html":"/case_study_05_pav_receita_federal_final.html"
  };
  function init(){
    const en=document.querySelector('[data-lang="en"]');
    const pt=document.querySelector('[data-lang="pt"]');
    const path=window.location.pathname.replace(/\/$/,"")||"/";
    const isEnglish=path==="/en"||path.startsWith("/en/");
    const counterpart=map[path];
    if(en){en.href=counterpart&&isEnglish?counterpart:"/en/";en.setAttribute("aria-current",isEnglish?"page":"false");}
    if(pt){pt.href=counterpart&&!isEnglish?counterpart:"/";pt.setAttribute("aria-current",isEnglish?"false":"page");}
    document.documentElement.lang=isEnglish?"en":"pt-BR";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();