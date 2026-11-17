document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "sedu_es_faltas_v2";

  const state = {
    activeTab: "trimestres",
    t1: 0,
    t2: 0,
    t3: 0,
    totalDireto: 0,
    aulasPorDia: 7,
    totalAulasAno: 1400
  };

  // Elementos DOM
  const tabTrimestres = document.getElementById("tab-trimestres");
  const tabTotal = document.getElementById("tab-total");
  const panelTrimestres = document.getElementById("panel-trimestres");
  const panelTotal = document.getElementById("panel-total");

  const inputT1 = document.getElementById("input-t1");
  const inputT2 = document.getElementById("input-t2");
  const inputT3 = document.getElementById("input-t3");
  const inputTotalDireto = document.getElementById("input-total-direto");
  const somaTrimestresPreview = document.getElementById("soma-trimestres-preview");

  const cfgAulasDia = document.getElementById("cfg-aulas-dia");
  const cfgTotalAulas = document.getElementById("cfg-total-aulas");
  const cfgResumo = document.getElementById("cfg-resumo");
  const configPanel = document.getElementById("config-panel");
  const btnToggleConfig = document.getElementById("btn-toggle-config");
  const btnLimpar = document.getElementById("btn-limpar");

  const statusTitulo = document.getElementById("status-titulo");
  const statusPill = document.getElementById("status-pill");
  const progressFill = document.getElementById("progress-fill");
  const metaFaltas = document.getElementById("meta-faltas");
  const metaFrequencia = document.getElementById("meta-frequencia");

  const resTotalFaltas = document.getElementById("res-total-faltas");
  const resDiasFaltados = document.getElementById("res-dias-faltados");
  const resFrequencia = document.getElementById("res-frequencia");
  const resPodeDias = document.getElementById("res-pode-dias");
  const resPodeAulas = document.getElementById("res-pode-aulas");
  const resReprovaDias = document.getElementById("res-reprova-dias");
  const resReprovaAulas = document.getElementById("res-reprova-aulas");

  function toNonNegativeInt(value) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  function formatDiasEAulas(totalAulas, aulasPorDia) {
    const diasInteiros = Math.floor(totalAulas / aulasPorDia);
    const aulasRestantes = totalAulas % aulasPorDia;
    if (diasInteiros === 0 && aulasRestantes === 0) return "0 dias";
    if (aulasRestantes === 0) {
      return `${diasInteiros} ${diasInteiros === 1 ? "dia" : "dias"}`;
    }
    if (diasInteiros === 0) {
      return `${aulasRestantes} ${aulasRestantes === 1 ? "aula" : "aulas"}`;
    }
    return `${diasInteiros}d + ${aulasRestantes}a`;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Ignora erro caso o navegador bloqueie localStorage
    }
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        state.activeTab = parsed.activeTab === "total" ? "total" : "trimestres";
        state.t1 = toNonNegativeInt(parsed.t1);
        state.t2 = toNonNegativeInt(parsed.t2);
        state.t3 = toNonNegativeInt(parsed.t3);
        state.totalDireto = toNonNegativeInt(parsed.totalDireto);
        state.aulasPorDia = Math.max(1, toNonNegativeInt(parsed.aulasPorDia) || 7);
        state.totalAulasAno = Math.max(100, toNonNegativeInt(parsed.totalAulasAno) || 1400);
      }
    } catch (err) {
      // Segue com valores padrão
    }
  }

  function syncInputsFromState() {
    inputT1.value = state.t1 > 0 ? state.t1 : "";
    inputT2.value = state.t2 > 0 ? state.t2 : "";
    inputT3.value = state.t3 > 0 ? state.t3 : "";
    inputTotalDireto.value = state.totalDireto > 0 ? state.totalDireto : "";
    cfgAulasDia.value = state.aulasPorDia;
    cfgTotalAulas.value = state.totalAulasAno;
    setActiveTab(state.activeTab, false);
  }

  function setActiveTab(tabName, shouldRecalc = true) {
    state.activeTab = tabName;
    const isTrimestres = tabName === "trimestres";

    tabTrimestres.classList.toggle("active", isTrimestres);
    tabTotal.classList.toggle("active", !isTrimestres);

    panelTrimestres.classList.toggle("active", isTrimestres);
    panelTotal.classList.toggle("active", !isTrimestres);

    if (shouldRecalc) {
      saveState();
      calculate();
    }
  }

  function calculate() {
    const aulasPorDia = Math.max(1, toNonNegativeInt(cfgAulasDia.value) || 7);
    const totalAulasAno = Math.max(100, toNonNegativeInt(cfgTotalAulas.value) || 1400);

    state.aulasPorDia = aulasPorDia;
    state.totalAulasAno = totalAulasAno;
    state.t1 = toNonNegativeInt(inputT1.value);
    state.t2 = toNonNegativeInt(inputT2.value);
    state.t3 = toNonNegativeInt(inputT3.value);
    state.totalDireto = toNonNegativeInt(inputTotalDireto.value);

    const somaTrimestres = state.t1 + state.t2 + state.t3;
    somaTrimestresPreview.textContent = `${somaTrimestres} ${somaTrimestres === 1 ? "falta" : "faltas"}`;

    const limiteFaltas = Math.floor(totalAulasAno * 0.25); // 350 no padrão 1400
    const faltasParaReprovarAbsoluto = limiteFaltas + 1;   // 351 no padrão 1400

    cfgResumo.textContent = `Regra atual: ${aulasPorDia} aulas/dia • Limite máximo de ${limiteFaltas} faltas (25% de ${totalAulasAno} aulas).`;

    const totalFaltas = state.activeTab === "trimestres" ? somaTrimestres : state.totalDireto;

    // Porcentagens
    const pctFaltas = (totalFaltas / totalAulasAno) * 100;
    const pctFrequencia = Math.max(0, 100 - pctFaltas);
    const pctLimiteUsado = limiteFaltas > 0 ? (totalFaltas / limiteFaltas) * 100 : 100;

    // Margem segura (ainda pode faltar)
    const aulasAindaPodeFaltar = Math.max(0, limiteFaltas - totalFaltas);
    const diasInteirosPodeFaltar = Math.floor(aulasAindaPodeFaltar / aulasPorDia);
    const sobraAulasPodeFaltar = aulasAindaPodeFaltar % aulasPorDia;

    // Quantos dias faltando para reprovar
    const aulasRestantesParaReprovar = Math.max(0, faltasParaReprovarAbsoluto - totalFaltas);
    const diasInteirosParaReprovar = Math.ceil(aulasRestantesParaReprovar / aulasPorDia);

    // Atualiza UI
    resTotalFaltas.textContent = `${totalFaltas} ${totalFaltas === 1 ? "aula" : "aulas"}`;
    const diasJaFaltados = (totalFaltas / aulasPorDia).toFixed(1).replace(".0", "");
    resDiasFaltados.textContent = `Equivale a ${diasJaFaltados} ${diasJaFaltados === "1" ? "dia letivo" : "dias letivos"}`;

    resFrequencia.textContent = `${pctFrequencia.toFixed(1)}%`;
    metaFaltas.textContent = `${totalFaltas} / ${limiteFaltas} faltas permitidas`;
    metaFrequencia.textContent = `Frequência: ${pctFrequencia.toFixed(1)}%`;

    // Atualiza cartões de "Ainda pode faltar" e "Reprova se faltar"
    if (totalFaltas > limiteFaltas) {
      resPodeDias.textContent = "0 dias";
      resPodeAulas.textContent = "Limite já ultrapassado";

      const excesso = totalFaltas - limiteFaltas;
      resReprovaDias.textContent = "Reprovado";
      resReprovaAulas.textContent = `Passou ${excesso} ${excesso === 1 ? "aula" : "aulas"} do limite`;
    } else {
      resPodeDias.textContent = `${diasInteirosPodeFaltar} ${diasInteirosPodeFaltar === 1 ? "dia" : "dias"}`;
      resPodeAulas.textContent =
        sobraAulasPodeFaltar > 0
          ? `${aulasAindaPodeFaltar} aulas (${diasInteirosPodeFaltar}d e ${sobraAulasPodeFaltar}a)`
          : `${aulasAindaPodeFaltar} aulas exatas`;

      resReprovaDias.textContent = `${diasInteirosParaReprovar} ${diasInteirosParaReprovar === 1 ? "dia" : "dias"}`;
      resReprovaAulas.textContent = `Faltando mais ${aulasRestantesParaReprovar} ${aulasRestantesParaReprovar === 1 ? "aula" : "aulas"} (atinge ${faltasParaReprovarAbsoluto})`;
    }

    // Barra de progresso e status
    const barWidth = Math.min(100, Math.max(0, pctLimiteUsado));
    progressFill.style.width = `${barWidth}%`;

    statusPill.classList.remove("warn", "danger");

    if (totalFaltas > limiteFaltas) {
      statusTitulo.textContent = "Limite Ultrapassado (Risco de Reprovação)";
      statusPill.textContent = `${pctLimiteUsado.toFixed(0)}% do limite`;
      statusPill.classList.add("danger");
      progressFill.style.backgroundColor = "var(--danger)";
    } else if (pctLimiteUsado >= 80) {
      statusTitulo.textContent = "Atenção Crítica — Muito Perto do Limite";
      statusPill.textContent = `${pctLimiteUsado.toFixed(0)}% do limite usado`;
      statusPill.classList.add("danger");
      progressFill.style.backgroundColor = "var(--danger)";
    } else if (pctLimiteUsado >= 50) {
      statusTitulo.textContent = "Atenção Moderada — Controle suas Faltas";
      statusPill.textContent = `${pctLimiteUsado.toFixed(0)}% do limite usado`;
      statusPill.classList.add("warn");
      progressFill.style.backgroundColor = "var(--warn)";
    } else {
      statusTitulo.textContent = "Frequência Segura";
      statusPill.textContent = `${pctLimiteUsado.toFixed(0)}% do limite usado`;
      progressFill.style.backgroundColor = "var(--ok)";
    }

    saveState();
  }

  // Eventos das Abas
  tabTrimestres.addEventListener("click", () => setActiveTab("trimestres", true));
  tabTotal.addEventListener("click", () => setActiveTab("total", true));

  // Eventos de Digitação
  [inputT1, inputT2, inputT3, inputTotalDireto, cfgAulasDia, cfgTotalAulas].forEach((el) => {
    el.addEventListener("input", calculate);
  });

  // Abrir/Fechar Configurações
  btnToggleConfig.addEventListener("click", () => {
    configPanel.classList.toggle("open");
  });

  // Botão Limpar
  btnLimpar.addEventListener("click", () => {
    state.t1 = 0;
    state.t2 = 0;
    state.t3 = 0;
    state.totalDireto = 0;
    inputT1.value = "";
    inputT2.value = "";
    inputT3.value = "";
    inputTotalDireto.value = "";
    calculate();
  });

  // Inicialização
  loadState();
  syncInputsFromState();
  calculate();
});
          
