(() => {
  const GAME_KEY = "ums_game_state";
  const ROLES_KEY = "ums_roles";
  const POSTS_KEY = "ums_wall_posts_v1";
  const OWNER_KEY = "ums_note_owner_v1";
  const OWNED_POSTS_KEY = "ums_wall_owned_ids_v1";
  function getWallOwnerToken() {
    let token = localStorage.getItem(OWNER_KEY);
    if (!token) {
      if (window.crypto?.randomUUID) token = window.crypto.randomUUID();
      else if (window.crypto?.getRandomValues) {
        const bytes = new Uint8Array(24);
        window.crypto.getRandomValues(bytes);
        token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      } else token = `${Date.now().toString(36)}-${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      localStorage.setItem(OWNER_KEY, token);
    }
    return token;
  }
  function readOwnedPostIds() {
    try {
      const ids = JSON.parse(localStorage.getItem(OWNED_POSTS_KEY) || "[]");
      return new Set(Array.isArray(ids) ? ids.map(String) : []);
    } catch { return new Set(); }
  }
  function saveOwnedPostIds(ids) {
    localStorage.setItem(OWNED_POSTS_KEY, JSON.stringify([...ids]));
  }

  const roleMeta = {
    urbanista: { name: "Urbanista", stat: "infrastructure", affinity: [0, 1] },
    educador: { name: "Educador", stat: "education", affinity: [2, 4] },
    saude: { name: "Agente de saúde", stat: "health", affinity: [0, 6] },
    cultura: { name: "Produtor cultural", stat: "culture", affinity: [1, 2] },
    articulador: { name: "Articulador", stat: "employment", affinity: [3, 5] },
    comunicacao: { name: "Comunicador", stat: "quality", affinity: [3] }
  };
  const metricMeta = [
    ["quality", "Qualidade de vida"], ["education", "Educação"], ["infrastructure", "Infraestrutura"],
    ["culture", "Cultura e lazer"], ["sanitation", "Saneamento"], ["health", "Saúde"], ["employment", "Emprego e renda"]
  ];
  const missions = [
    {
      category: "SANEAMENTO BÁSICO", title: "Falta de saneamento básico",
      description: "A comunidade enfrenta problemas com esgoto a céu aberto, falta de água tratada e coleta irregular de lixo. A situação afeta a rotina e a saúde de centenas de moradores.",
      situation: "Você tem recursos limitados e precisa decidir como começar a enfrentar o problema. Uma solução duradoura exige planejamento, mas deixar tudo como está também tem um custo.",
      choices: [
        { id: "saneamento-obra", title: "Investir em saneamento e drenagem", summary: "Obras prioritárias, pontos de coleta e articulação para ampliar o acesso à água tratada.", cost: 24000, effects: { sanitation: 19, infrastructure: 9, quality: 8, health: 4 }, immediate: "Os pontos mais críticos recebem uma intervenção estrutural e o descarte irregular começa a diminuir.", residents: "Famílias passam a conviver com menos esgoto exposto e melhores condições de higiene. O benefício é gradual e precisa de manutenção.", why: "É a solução mais consistente, mas a obra não resolve tudo de uma vez: fiscalização, manutenção e diálogo com os moradores continuam necessários.", reflection: "Infraestrutura básica não é luxo: é saúde, dignidade e segurança para quem vive no território." },
        { id: "saneamento-estetica", title: "Melhorar a aparência das ruas", summary: "Pintura de fachadas e limpeza pontual nas áreas mais visíveis.", cost: 12000, effects: { infrastructure: 3, quality: 1, sanitation: -3 }, immediate: "Algumas ruas ficam visualmente mais organizadas, mas o esgoto e a falta de água tratada continuam presentes.", residents: "A mudança pode gerar uma sensação momentânea de cuidado, porém quem mora nas áreas mais afetadas continua exposto aos mesmos riscos.", why: "A ação trata o que aparece, não a causa do problema. Sem saneamento, a comunidade pode gastar novamente com limpeza e reparos emergenciais.", reflection: "Uma solução que aparece nas fotos nem sempre é a que melhora a vida de quem mora ali." , flag: "sanitationDebt"},
        { id: "saneamento-adiar", title: "Guardar o dinheiro para outra urgência", summary: "Não realizar uma intervenção agora e reservar todo o orçamento.", cost: 0, effects: { sanitation: -8, health: -4, quality: -4 }, immediate: "O orçamento permanece intacto, mas o problema segue se agravando nos pontos críticos.", residents: "Moradores continuam convivendo com água contaminada, mau cheiro e maior risco de doenças relacionadas à falta de saneamento.", why: "Adiar pode parecer prudente, mas a falta de prevenção costuma gerar custos maiores para a saúde e para a infraestrutura no futuro.", reflection: "Economizar hoje pode significar pagar muito mais caro amanhã.", flag: "sanitationDebt" }
      ]
    },
    {
      category: "CULTURA E LAZER", title: "Ausência de lazer",
      description: "As crianças e os jovens não possuem espaços adequados para praticar esportes, brincar ou conviver. A praça está degradada e faltam atividades gratuitas no bairro.",
      situation: "Os moradores pedem um espaço de convivência. Você precisa escolher entre uma estrutura permanente, uma alternativa mais rápida ou guardar recursos para outras demandas.",
      choices: [
        { id: "lazer-quadra", title: "Construir uma quadra comunitária", summary: "Criar um espaço esportivo iluminado, acessível e aberto a diferentes faixas etárias.", cost: 22000, effects: { infrastructure: 5, culture: 7, quality: 10, health: 4 }, immediate: "A comunidade ganha um espaço permanente para esporte, encontros e atividades coletivas.", residents: "Crianças, jovens e adultos passam a ter um local seguro para praticar atividades e fortalecer vínculos.", why: "A quadra precisa de manutenção, programação inclusiva e gestão comunitária para não se tornar um espaço abandonado.", reflection: "Espaços públicos bem cuidados ajudam a criar pertencimento e convivência." },
        { id: "lazer-atividades", title: "Organizar atividades em espaços existentes", summary: "Promover aulas, jogos e recreação em locais já disponíveis no bairro.", cost: 9000, effects: { culture: 5, quality: 5, health: 3 }, immediate: "As primeiras atividades começam rapidamente, aproveitando espaços que já existem.", residents: "Mais pessoas participam de atividades gratuitas, embora ainda falte um equipamento permanente para todos.", why: "É uma solução acessível, mas depende de continuidade, profissionais e acordos para manter os locais disponíveis.", reflection: "Nem toda transformação começa com uma grande obra: às vezes, começa ocupando melhor o que já existe." },
        { id: "lazer-adiar", title: "Priorizar outras necessidades", summary: "Não investir em lazer nesta etapa e manter o orçamento disponível.", cost: 0, effects: { culture: -5, quality: -4 }, immediate: "O orçamento não diminui, mas os espaços de convivência continuam sem melhorias.", residents: "Crianças e jovens seguem sem opções gratuitas de lazer próximas de casa, e a praça permanece pouco utilizada.", why: "Lazer costuma ser tratado como algo secundário, mas também contribui para saúde, proteção, socialização e qualidade de vida.", reflection: "Ter um lugar para brincar, criar e conviver também é parte do direito à cidade." }
      ]
    },
    {
      category: "CULTURA E IDENTIDADE", title: "Falta de atividades culturais",
      description: "A comunidade possui poucos espaços para música, dança, teatro, arte e manifestações culturais. Artistas locais têm dificuldade para divulgar seus trabalhos.",
      situation: "Jovens querem oficinas e oportunidades para mostrar sua produção. Você pode criar uma estrutura, apoiar iniciativas que já existem ou deixar o tema para depois.",
      choices: [
        { id: "cultura-centro", title: "Criar um espaço cultural comunitário", summary: "Adaptar um espaço para oficinas, ensaios, apresentações e encontros de artistas locais.", cost: 19000, effects: { culture: 18, education: 3, employment: 3, quality: 5 }, immediate: "Um espaço passa a receber oficinas, ensaios e apresentações abertas à comunidade.", residents: "Artistas locais encontram um ponto de apoio e jovens ganham oportunidades de aprender e se expressar.", why: "O espaço precisa de programação construída com os moradores e de apoio contínuo para não ficar restrito a poucos grupos.", reflection: "Investir em cultura também é investir em educação, identidade e oportunidades." },
        { id: "cultura-coletivos", title: "Apoiar coletivos e artistas locais", summary: "Oferecer pequenos editais, materiais e divulgação para iniciativas que já atuam no território.", cost: 11000, effects: { culture: 11, employment: 4, quality: 4 }, immediate: "Grupos locais recebem apoio para realizar eventos, oficinas e divulgar suas produções.", residents: "A cultura ganha visibilidade sem depender de um único equipamento, e o recurso chega a iniciativas que já conhecem o território.", why: "O apoio precisa ser transparente e chegar a diferentes linguagens, bairros e grupos, não apenas aos mais conhecidos.", reflection: "Valorizar quem já faz cultura no território é reconhecer saberes que muitas vezes ficam invisíveis." },
        { id: "cultura-nao", title: "Não investir em cultura agora", summary: "Direcionar o orçamento para outras áreas e não criar apoio cultural nesta etapa.", cost: 0, effects: { culture: -7, quality: -2 }, immediate: "Outras demandas podem receber atenção, mas os artistas continuam sem espaço e incentivo.", residents: "Jovens perdem oportunidades de formação e a comunidade segue com poucas alternativas culturais gratuitas.", why: "A ausência de investimento também tem consequência: reduz a circulação das produções locais e dificulta o reconhecimento da identidade cultural.", reflection: "Quando uma cultura não encontra espaço para existir, toda a sociedade perde uma parte de sua história." }
      ]
    },
    {
      category: "IGUALDADE E INCLUSÃO", title: "Preconceito e desigualdade",
      description: "Moradores enfrentam discriminação por viverem em uma favela. Há relatos de pessoas que não conseguem oportunidades de trabalho por causa do endereço onde moram.",
      situation: "A comunidade quer respeito e acesso às mesmas oportunidades. Você precisa escolher uma resposta que enfrente tanto a discriminação quanto seus efeitos práticos.",
      choices: [
        { id: "inclusao-pacto", title: "Criar um pacto por oportunidades e contratação", summary: "Conectar empresas, cursos e moradores com critérios de seleção transparentes e ações contra discriminação.", cost: 15000, effects: { employment: 11, quality: 7, education: 2 }, immediate: "Empresas parceiras são chamadas a rever barreiras e abrir processos de seleção mais acessíveis.", residents: "Moradores passam a ter mais canais para apresentar suas habilidades e disputar vagas sem serem definidos pelo CEP.", why: "Um pacto só funciona com compromissos verificáveis, acompanhamento das contratações e participação de quem sofre a discriminação.", reflection: "O lugar onde alguém mora não define sua capacidade, seu talento ou seu futuro." },
        { id: "inclusao-rede", title: "Montar uma rede de orientação e apoio", summary: "Oferecer orientação sobre direitos, currículo, entrevistas e canais de denúncia.", cost: 8000, effects: { employment: 5, quality: 6, education: 2 }, immediate: "Moradores encontram orientação para reconhecer situações discriminatórias e buscar seus direitos.", residents: "Mais pessoas conseguem preparar currículos, conhecer canais de apoio e se organizar coletivamente.", why: "A orientação fortalece os moradores, mas não substitui políticas de contratação inclusiva nem a responsabilização de quem discrimina.", reflection: "Informação e apoio ajudam a enfrentar injustiças, mas a responsabilidade de mudar também é das instituições." },
        { id: "inclusao-ignorar", title: "Tratar o preconceito como um problema individual", summary: "Não criar nenhuma ação coletiva e esperar que cada morador resolva suas dificuldades.", cost: 0, effects: { employment: -6, quality: -7 }, immediate: "Nenhum recurso é gasto, mas as barreiras existentes continuam sem resposta coletiva.", residents: "Pessoas seguem enfrentando julgamentos pelo endereço e podem deixar de procurar oportunidades por experiências anteriores.", why: "O preconceito não é resolvido apenas com esforço individual. Sem ações institucionais, a desigualdade tende a se repetir.", reflection: "Igualdade não significa pedir que cada pessoa supere sozinha barreiras que foram criadas socialmente." }
      ]
    },
    {
      category: "EDUCAÇÃO", title: "Educação precária",
      description: "A comunidade enfrenta dificuldades relacionadas ao acesso à educação, reforço escolar e atividades extracurriculares. Muitas famílias não conseguem pagar por apoio fora da escola.",
      situation: "Há estudantes que precisam de acompanhamento e acesso a materiais. O orçamento permite começar um projeto, mas será necessário escolher o formato.",
      choices: [
        { id: "educacao-reforco", title: "Oferecer reforço escolar e oficinas", summary: "Criar turmas gratuitas de acompanhamento, leitura, matemática e atividades complementares.", cost: 19000, effects: { education: 16, quality: 5, employment: 3 }, immediate: "Estudantes passam a ter horários de apoio e atividades além do período regular de aula.", residents: "Famílias ganham uma alternativa gratuita de acompanhamento e estudantes podem recuperar conteúdos com apoio.", why: "O projeto depende de educadores, materiais e diálogo com as escolas para manter qualidade e continuidade.", reflection: "Oportunidade educacional não deveria depender da renda de uma família." },
        { id: "educacao-lab", title: "Montar um laboratório comunitário", summary: "Disponibilizar computadores, internet e orientação para pesquisa e atividades digitais.", cost: 14000, effects: { education: 11, employment: 4, quality: 3 }, immediate: "Moradores passam a contar com um local para estudar, pesquisar e desenvolver habilidades digitais.", residents: "Estudantes e adultos ganham acesso a ferramentas que podem apoiar a aprendizagem e a busca por trabalho.", why: "Equipamentos sem manutenção, internet estável e acompanhamento podem acabar subutilizados.", reflection: "Acesso à tecnologia só se transforma em oportunidade quando vem acompanhado de condições para aprender." },
        { id: "educacao-adiar", title: "Deixar a educação para uma próxima etapa", summary: "Não criar uma iniciativa educacional neste momento.", cost: 0, effects: { education: -7, quality: -3 }, immediate: "O orçamento fica disponível para outras ações, mas as dificuldades dos estudantes permanecem.", residents: "Quem não pode pagar reforço ou atividades extras continua com menos opções de apoio.", why: "Adiar a educação pode ampliar dificuldades acumuladas e limitar oportunidades futuras, especialmente para quem já tem menos recursos.", reflection: "A desigualdade educacional cresce quando as oportunidades chegam apenas para quem pode pagar." }
      ]
    },
    {
      category: "EMPREGO E RENDA", title: "Desemprego e falta de oportunidades",
      description: "Muitos moradores estão desempregados e enfrentam dificuldades financeiras. Pequenos empreendedores também encontram barreiras para formalizar e ampliar seus negócios.",
      situation: "A equipe precisa decidir como fortalecer a renda local: preparar pessoas para novas vagas, apoiar pequenos negócios ou conectar quem procura trabalho a oportunidades existentes.",
      choices: [
        { id: "emprego-cursos", title: "Oferecer cursos profissionalizantes", summary: "Criar formações curtas em áreas com demanda e encaminhamento para processos seletivos.", cost: 21000, effects: { employment: 15, education: 4, quality: 6 }, immediate: "Moradores iniciam cursos com conteúdo prático e orientação para buscar vagas.", residents: "Pessoas desempregadas ganham repertório e apoio para disputar oportunidades de trabalho.", why: "A formação precisa estar conectada a vagas reais e não pode prometer emprego automático ao final do curso.", reflection: "Capacitação abre portas, mas também é necessário que existam oportunidades e condições justas de contratação." },
        { id: "emprego-negocios", title: "Apoiar pequenos negócios locais", summary: "Criar orientação, microapoio e rede de divulgação para empreendedores do bairro.", cost: 18000, effects: { employment: 12, quality: 5, culture: 2 }, immediate: "Pequenos negócios recebem orientação e apoio para organizar e divulgar seus serviços.", residents: "A renda pode circular mais dentro da comunidade e iniciativas locais ganham visibilidade.", why: "O apoio precisa ter critérios claros e acompanhamento. Nem todo negócio consegue crescer apenas com um incentivo inicial.", reflection: "Fortalecer a economia local também significa reconhecer o trabalho e o conhecimento de quem vive no território." },
        { id: "emprego-feira", title: "Realizar uma feira de oportunidades", summary: "Aproximar moradores de empresas, serviços e iniciativas de geração de renda em um evento comunitário.", cost: 6000, effects: { employment: 5, quality: 2 }, immediate: "Moradores conseguem conversar com empresas e conhecer oportunidades em um único espaço.", residents: "A feira facilita contatos e troca de informações, mas os resultados dependem das vagas e do acompanhamento depois do evento.", why: "Um evento isolado não substitui formação, apoio contínuo nem políticas para geração de emprego e renda.", reflection: "Conectar pessoas e oportunidades é importante, mas o acesso precisa continuar depois do evento." },
        { id: "emprego-rede", title: "Ativar uma rede comunitária de vagas", summary: "Usar grupos e espaços existentes para compartilhar oportunidades e orientar moradores.", cost: 0, effects: { employment: 2, quality: 1 }, immediate: "Moradores começam a compartilhar vagas, contatos e informações usando canais que já existem na comunidade.", residents: "A rede facilita o acesso à informação sem exigir um gasto imediato do orçamento público.", why: "A iniciativa tem alcance limitado e depende da participação voluntária. Ela não substitui cursos, políticas de emprego ou apoio financeiro.", reflection: "Mesmo com poucos recursos, conectar pessoas pode abrir caminhos — mas a rede precisa de oportunidades reais para divulgar." }
      ]
    },
    {
      category: "SAÚDE PÚBLICA", title: "Saúde e atendimento público",
      description: "Os moradores enfrentam dificuldades para conseguir atendimento médico e acesso a serviços básicos de saúde. A prevenção também é limitada pela distância e pela falta de informação.",
      situation: "Você chegou ao último desafio com um orçamento menor do que no início. É preciso decidir como melhorar o cuidado e a prevenção sem gastar mais do que existe.",
      choices: [
        { id: "saude-unidade", title: "Ampliar uma unidade de atendimento básico", summary: "Articular atendimento regular, acolhimento e acompanhamento de famílias em áreas prioritárias.", cost: 25000, effects: { health: 18, quality: 9 }, immediate: "A comunidade ganha uma estrutura de atendimento mais próxima e com maior capacidade de acolhimento.", residents: "Famílias podem buscar cuidados preventivos e acompanhamento com menos deslocamento.", why: "Uma unidade precisa de profissionais, insumos e integração com a rede pública; construir ou reformar sem equipe não garante atendimento.", reflection: "Saúde de qualidade depende de estrutura, profissionais e continuidade do cuidado." },
        { id: "saude-movel", title: "Organizar ações móveis de prevenção", summary: "Levar orientação, vacinação e encaminhamentos para diferentes pontos da comunidade.", cost: 13000, effects: { health: 12, quality: 6 }, immediate: "Ações periódicas aproximam serviços e informação dos moradores.", residents: "Pessoas que encontram dificuldade para se deslocar têm mais oportunidades de receber orientação e encaminhamento.", why: "As ações móveis ampliam o acesso, mas precisam estar conectadas a serviços permanentes para garantir continuidade.", reflection: "Prevenir é importante, mas ninguém deve ficar sem atendimento quando precisa de cuidado." },
        { id: "saude-adiar", title: "Adiar o investimento em saúde", summary: "Manter o orçamento restante e não criar novas ações de atendimento agora.", cost: 0, effects: { health: -8, quality: -5 }, immediate: "Nenhum valor é gasto nesta etapa, mas a dificuldade de acesso à saúde continua.", residents: "Moradores seguem dependendo de serviços que já estão sobrecarregados e podem buscar atendimento apenas quando o problema piora.", why: "Sem prevenção e acesso oportuno, problemas simples podem se agravar e pressionar ainda mais o sistema de saúde.", reflection: "A falta de atendimento também tem custo — e ele costuma aparecer na vida de quem mais precisa." }
      ]
    }
  ];

  const $ = (id) => document.getElementById(id);
  let roles = [];
  try { roles = JSON.parse(localStorage.getItem(ROLES_KEY) || "[]"); } catch { roles = []; }
  if (!Array.isArray(roles) || roles.length !== 2 || roles.some((role) => !roleMeta[role])) {
    window.location.replace("funcoes.html");
    return;
  }

  function initialState() {
    const metrics = { quality: 50, education: 50, infrastructure: 40, culture: 30, sanitation: 35, health: 45, employment: 35 };
    roles.forEach((role) => { const stat = roleMeta[role].stat; metrics[stat] = Math.min(100, metrics[stat] + 4); });
    return { roles, current: 0, budget: 100000, initialBudget: 100000, metrics, selectedChoice: null, history: [], flags: {}, done: false };
  }
  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(GAME_KEY) || "null");
      if (parsed && Array.isArray(parsed.history) && parsed.metrics && parsed.roles?.length === 2 && parsed.roles.every((r) => roleMeta[r])) {
        // O conjunto de funções salvo é a referência da partida atual.
        if (parsed.roles.join("|") === roles.join("|")) return parsed;
      }
    } catch { /* inicia uma partida nova quando o armazenamento estiver inválido */ }
    return initialState();
  }
  let state = loadState();
  let selectedIndex = state.selectedChoice ?? null;
  let toastTimer;

  function saveState() { localStorage.setItem(GAME_KEY, JSON.stringify(state)); }
  function clamp(value) { return Math.max(0, Math.min(100, Math.round(value))); }
  function money(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value); }
  function showToast(message) {
    const toast = $("gameToast"); if (!toast) return;
    toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }
  function renderDashboard() {
    $("budgetValue").textContent = money(state.budget);
    $("budgetBar").style.width = `${Math.max(0, Math.min(100, (state.budget / state.initialBudget) * 100))}%`;
    $("budgetUsed").textContent = `${Math.round((state.budget / state.initialBudget) * 100)}% do orçamento inicial`;
    $("metricsList").replaceChildren(...metricMeta.map(([key, label]) => {
      const row = document.createElement("div"); row.className = "metric-row";
      const name = document.createElement("span"); name.className = "metric-label"; name.textContent = label;
      const value = document.createElement("b"); value.className = "metric-value"; value.textContent = `${state.metrics[key]} / 100`;
      const track = document.createElement("span"); track.className = "metric-track";
      const fill = document.createElement("i"); fill.style.width = `${state.metrics[key]}%`; track.append(fill);
      row.append(name, value, track); return row;
    }));
    $("teamTags").replaceChildren(...roles.map((role) => {
      const tag = document.createElement("span"); tag.className = "team-tag"; tag.textContent = roleMeta[role].name; return tag;
    }));
  }
  function renderProgress() {
    const total = missions.length; const completed = state.history.length;
    const percent = Math.round((completed / total) * 100);
    $("progressBar").style.width = `${percent}%`;
    $("progressPercent").textContent = `${percent}% CONCLUÍDO`;
    const labelIndex = Math.min(state.current + 1, total);
    $("topLevel").textContent = state.done ? "JORNADA CONCLUÍDA" : `ETAPA ${String(labelIndex).padStart(2, "0")} / 07`;
  }
  function renderMission() {
    const mission = missions[state.current];
    if (!mission) return showRevelation();
    $("missionCategory").textContent = mission.category;
    $("missionTitle").textContent = mission.title;
    $("missionNumber").textContent = String(state.current + 1).padStart(2, "0");
    $("giantNumber").textContent = String(state.current + 1).padStart(2, "0");
    $("missionDescription").textContent = mission.description;
    let situation = mission.situation;
    if (state.current === 6 && state.flags.sanitationDebt) situation += " Como o saneamento foi adiado, o impacto na saúde pode ser ainda maior.";
    if (state.current === 5 && state.metrics.education < 45) situation += " A baixa pontuação de educação torna a formação profissional ainda mais necessária.";
    $("missionSituation").textContent = situation;
    const list = $("choiceList");
    list.replaceChildren(...mission.choices.map((choice, index) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "choice-card";
      if (selectedIndex === index) button.classList.add("selected");
      const unavailable = choice.cost > state.budget;
      button.disabled = unavailable;
      button.setAttribute("aria-pressed", String(selectedIndex === index));
      const letter = document.createElement("span"); letter.className = "choice-letter"; letter.textContent = String.fromCharCode(65 + index);
      const copy = document.createElement("span"); copy.className = "choice-copy";
      const title = document.createElement("strong"); title.textContent = choice.title;
      const desc = document.createElement("small"); desc.textContent = unavailable ? `${choice.summary} · Orçamento insuficiente para esta opção.` : choice.summary;
      copy.append(title, desc);
      const cost = document.createElement("span"); cost.className = "choice-cost"; cost.textContent = choice.cost === 0 ? "Sem custo" : money(choice.cost);
      const costHint = document.createElement("small"); costHint.textContent = choice.cost === 0 ? "R$ 0" : "INVESTIMENTO"; cost.append(costHint);
      button.append(letter, copy, cost);
      button.addEventListener("click", () => selectChoice(index));
      return button;
    }));
    $("confirmChoice").disabled = selectedIndex === null || mission.choices[selectedIndex]?.cost > state.budget;
    $("selectionFeedback").textContent = selectedIndex === null ? "Selecione uma alternativa para continuar." : "Alternativa selecionada. Confirme para ver as consequências.";
    $("resultCard").hidden = true; $("resultCard").replaceChildren();
    $("playLayout").style.display = "grid";
    $("missionColumn").style.display = "block";
    $("revelationScreen").hidden = true;
    $("revelationScreen").replaceChildren();
    renderProgress();
  }
  function selectChoice(index) {
    selectedIndex = index; state.selectedChoice = index; saveState();
    [...$("choiceList").children].forEach((button, i) => {
      button.classList.toggle("selected", i === index); button.setAttribute("aria-pressed", String(i === index));
    });
    $("confirmChoice").disabled = false;
    $("selectionFeedback").textContent = "Alternativa selecionada. Confirme para ver as consequências.";
  }
  function applyRoleBoost(missionIndex, effects) {
    const boosted = { ...effects };
    roles.forEach((role) => {
      if (roleMeta[role].affinity.includes(missionIndex)) {
        const stat = roleMeta[role].stat;
        // Habilidades da equipe melhoram em dois pontos o indicador central do desafio.
        const focusStat = missionIndex === 0 ? "sanitation" : missionIndex === 1 ? "culture" : missionIndex === 2 ? "culture" : missionIndex === 3 ? "employment" : missionIndex === 4 ? "education" : missionIndex === 5 ? "employment" : "health";
        boosted[focusStat] = (boosted[focusStat] || 0) + 2;
      }
    });
    return boosted;
  }
  function confirmChoice() {
    if (selectedIndex === null) return;
    const mission = missions[state.current]; const choice = mission.choices[selectedIndex];
    if (!choice || choice.cost > state.budget) { showToast("Essa alternativa custa mais do que o orçamento disponível."); return; }
    let effects = applyRoleBoost(state.current, choice.effects);
    let extraWhy = "";
    if (state.current === 6 && state.flags.sanitationDebt) {
      effects.health = (effects.health || 0) - 3;
      extraWhy = " Como o saneamento não foi resolvido antes, os problemas ambientais aumentam a pressão sobre a saúde dos moradores.";
    }
    if (state.current === 5 && state.metrics.education < 45) {
      extraWhy += " A dificuldade educacional também pode limitar o aproveitamento das ações de qualificação.";
    }
    state.budget = Math.max(0, state.budget - choice.cost);
    Object.entries(effects).forEach(([key, value]) => { if (Object.prototype.hasOwnProperty.call(state.metrics, key)) state.metrics[key] = clamp(state.metrics[key] + value); });
    if (choice.flag) state.flags[choice.flag] = true;
    const decision = {
      missionIndex: state.current, missionTitle: mission.title, choiceId: choice.id,
      choiceTitle: choice.title, cost: choice.cost, effects, immediate: choice.immediate,
      residents: choice.residents, why: choice.why + extraWhy, reflection: choice.reflection,
      beforeBudget: state.budget + choice.cost, afterBudget: state.budget
    };
    state.history.push(decision); state.selectedChoice = null; selectedIndex = null; saveState();
    renderDashboard(); renderProgress(); renderResult(decision);
    $("confirmChoice").disabled = true;
    [...$("choiceList").children].forEach((button) => { button.disabled = true; });
  }
  function renderResult(decision) {
    const card = $("resultCard"); card.hidden = false;
    const heading = document.createElement("div"); heading.className = "result-top";
    const badge = document.createElement("span"); badge.className = "result-badge"; badge.textContent = "✓ DECISÃO REGISTRADA";
    const cost = document.createElement("span"); cost.className = "result-cost"; cost.textContent = decision.cost ? `− ${money(decision.cost)}` : "R$ 0 investidos";
    heading.append(badge, cost);
    const title = document.createElement("h3"); title.textContent = decision.choiceTitle;
    const immediate = document.createElement("p"); immediate.innerHTML = "";
    const immediateLabel = document.createElement("strong"); immediateLabel.textContent = "RESULTADO IMEDIATO · ";
    immediate.append(immediateLabel, document.createTextNode(decision.immediate));
    const resident = document.createElement("p"); const residentLabel = document.createElement("strong"); residentLabel.textContent = "IMPACTO NOS MORADORES · "; resident.append(residentLabel, document.createTextNode(decision.residents));
    const why = document.createElement("p"); const whyLabel = document.createElement("strong"); whyLabel.textContent = "PONTO DE ATENÇÃO · "; why.append(whyLabel, document.createTextNode(decision.why));
    const impacts = document.createElement("div"); impacts.className = "result-impact";
    const labels = Object.fromEntries(metricMeta);
    Object.entries(decision.effects).forEach(([key, value]) => {
      const pill = document.createElement("div"); pill.className = "impact-pill";
      const name = document.createElement("span"); name.textContent = labels[key] || key;
      const amount = document.createElement("b"); amount.className = value < 0 ? "negative" : ""; amount.textContent = `${value > 0 ? "+" : ""}${value} pts`;
      pill.append(name, amount); impacts.append(pill);
    });
    const budgetPill = document.createElement("div"); budgetPill.className = "impact-pill";
    const budgetLabel = document.createElement("span"); budgetLabel.textContent = "Orçamento restante";
    const budgetValue = document.createElement("b"); budgetValue.textContent = money(state.budget); budgetPill.append(budgetLabel, budgetValue); impacts.append(budgetPill);
    const reflection = document.createElement("div"); reflection.className = "reflection-box";
    const reflectionLabel = document.createElement("span"); reflectionLabel.textContent = "PARA PENSAR";
    const reflectionText = document.createElement("p"); reflectionText.textContent = `“${decision.reflection}”`;
    reflection.append(reflectionLabel, reflectionText);
    const actions = document.createElement("div"); actions.className = "result-actions";
    const next = document.createElement("button"); next.type = "button"; next.className = "button button-green";
    next.innerHTML = state.current === missions.length - 1 ? 'VER O RESULTADO FINAL <span>→</span>' : 'PRÓXIMO DESAFIO <span>→</span>';
    next.addEventListener("click", nextMission); actions.append(next);
    card.replaceChildren(heading, title, immediate, resident, why, impacts, reflection, actions);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function nextMission() {
    state.current += 1; state.selectedChoice = null; selectedIndex = null;
    if (state.current >= missions.length) { state.done = true; saveState(); showRevelation(); }
    else { saveState(); renderMission(); $("missionColumn").scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function showRevelation() {
    state.done = true; saveState();
    $("playLayout").style.display = "none"; $("revelationScreen").hidden = false;
    $("topLevel").textContent = "JORNADA CONCLUÍDA";
    $("progressBar").style.width = "100%"; $("progressPercent").textContent = "100% CONCLUÍDO";
    $("revelationScreen").innerHTML = `
      <div class="reveal-kicker">✳ GRANDE REVELAÇÃO · FIM DA JORNADA</div>
      <h1>Você conseguiu administrar a Vila Esperança. <em>Mas agora precisamos contar uma coisa...</em></h1>
      <p class="reveal-lead">A Vila Esperança não existe. Mas os problemas que você enfrentou existem.</p>
      <p class="reveal-copy">A comunidade e os números desta experiência são fictícios. Os desafios foram inspirados em problemas sociais presentes em diversas comunidades brasileiras: desigualdade social, falta de saneamento básico, desigualdade no acesso à educação, ausência de espaços culturais e de lazer, preconceito contra moradores de periferias, desemprego e dificuldades de acesso à saúde.</p>
      <p class="reveal-copy">Fora do jogo, milhares de pessoas enfrentam situações semelhantes todos os dias — muitas vezes sem poder escolher como elas serão resolvidas. A experiência termina aqui, mas a reflexão continua: como as decisões públicas e coletivas podem ampliar direitos, dignidade e oportunidades?</p>
      <div class="reveal-stats">
        <div class="reveal-stat"><b>${money(state.budget)}</b><span>ORÇAMENTO RESTANTE</span></div>
        <div class="reveal-stat"><b>${state.metrics.quality}/100</b><span>QUALIDADE DE VIDA</span></div>
        <div class="reveal-stat"><b>${state.metrics.education}/100</b><span>EDUCAÇÃO</span></div>
        <div class="reveal-stat"><b>${state.history.length}/7</b><span>DESAFIOS CONCLUÍDOS</span></div>
      </div>
      <p class="final-quote">“Na vida real, não existe botão de reiniciar. Cada decisão, cada investimento e cada oportunidade podem mudar uma vida.”</p>
      <button class="button button-yellow" id="restartFromReveal" type="button">JOGAR NOVAMENTE <span>↻</span></button>
      <section class="wall-section" id="societyWall">
        <div class="wall-heading"><div><div class="eyebrow"><span class="eyebrow-dot"></span> SUA VOZ TAMBÉM IMPORTA</div><h2>Mural da Sociedade</h2></div><p>Você conheceu os desafios. Agora queremos ouvir sua opinião. Que mudanças você gostaria de ver na sociedade?</p></div>
        <form id="wallForm" class="wall-form">
          <div><label for="wallAuthor">NOME OU APELIDO</label><input id="wallAuthor" name="author" maxlength="28" placeholder="Seu nome" required></div>
          <div><label for="wallTitle">TÍTULO DA PUBLICAÇÃO</label><input id="wallTitle" name="title" maxlength="60" placeholder="Dê um título à sua ideia" required></div>
          <div class="wall-content-field"><label for="wallContent">SUA REFLEXÃO OU PROPOSTA</label><textarea id="wallContent" name="content" maxlength="400" placeholder="Compartilhe sua opinião..." required></textarea></div>
          <button class="button button-green" type="submit">PUBLICAR <span>↗</span></button>
        </form>
        <div class="wall-posts" id="wallPosts" aria-live="polite"></div>
        <p class="wall-status" id="wallStatus">As publicações ficam salvas neste navegador. Toque em uma publicação sua para ver a opção de apagar.</p>
      </section>`;
    $("restartFromReveal").addEventListener("click", restartGame);
    setupWall();
    $("revelationScreen").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function restartGame() {
    if (!window.confirm("Tem certeza de que deseja reiniciar? O progresso atual desta partida será apagado.")) return;
    localStorage.removeItem(GAME_KEY); window.location.href = "funcoes.html";
  }
  function setupWall() {
    const form = $("wallForm"); if (!form) return;
    const postArea = $("wallPosts");
    let posts = [];
    try { const parsed = JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); posts = Array.isArray(parsed) ? parsed : []; } catch { posts = []; }
    const ownerToken = getWallOwnerToken();
    const ownedPostIds = readOwnedPostIds();
    let migratedLocalPosts = false;
    posts.forEach((post) => {
      if (String(post.id || "").startsWith("local-") && !ownedPostIds.has(String(post.id))) {
        ownedPostIds.add(String(post.id));
        migratedLocalPosts = true;
      }
    });
    if (migratedLocalPosts) saveOwnedPostIds(ownedPostIds);
    const markPostAsOwned = (id) => { ownedPostIds.add(String(id)); saveOwnedPostIds(ownedPostIds); };
    const samplePosts = [
      { id: "sample-wall-1", author: "Visitante", title: "Uma comunidade com oportunidades", content: "A cultura periférica merece espaço, respeito e investimento para continuar criando oportunidades.", created_at: new Date().toISOString(), likes: 2, sample: true },
      { id: "sample-wall-2", author: "Morador(a)", title: "O que precisa mudar?", content: "Artistas e moradores já transformam seus territórios. A sociedade precisa ouvir e valorizar essas vozes.", created_at: new Date().toISOString(), likes: 1, sample: true }
    ];
    function save() { localStorage.setItem(POSTS_KEY, JSON.stringify(posts.slice(0, 60))); }
    function formatDate(value) {
      const date = new Date(value || Date.now());
      return Number.isNaN(date.getTime()) ? "Data não informada" : date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    function render() {
      const combined = [...posts, ...samplePosts].slice(0, 30);
      postArea.replaceChildren();
      if (!combined.length) { const empty = document.createElement("div"); empty.className = "wall-empty"; empty.textContent = "O mural ainda está vazio. Seja a primeira pessoa a publicar!"; postArea.append(empty); return; }
      combined.forEach((post) => {
        const article = document.createElement("article"); article.className = "wall-post";
        const title = document.createElement("h3"); title.textContent = post.title;
        const content = document.createElement("p"); content.textContent = post.content;
        const footer = document.createElement("div"); footer.className = "wall-post-footer";
        const meta = document.createElement("span"); meta.textContent = `${post.author} · ${formatDate(post.created_at)}`;
        const like = document.createElement("button"); like.type = "button"; like.className = "wall-like"; like.textContent = `♡ ${Number(post.likes || 0)}`; like.setAttribute("aria-label", `Curtir publicação de ${post.author}`);
        if (post.sample) like.disabled = false;
        like.addEventListener("click", async () => {
          if (post.sample) { post.likes = Number(post.likes || 0) + 1; like.textContent = `♡ ${post.likes}`; return; }
          if (post.id && typeof post.id === "number" && window.communityDb) {
            try { const updated = await window.dbLikePost(post.id); post.likes = Number(updated ?? post.likes + 1); }
            catch (error) { console.warn("Curtida não sincronizada:", error); post.likes = Number(post.likes || 0) + 1; }
          } else post.likes = Number(post.likes || 0) + 1;
          save(); like.textContent = `♡ ${post.likes}`;
        });
        const actions = document.createElement("div"); actions.className = "wall-post-actions";
        actions.append(like);
        if (!post.sample && ownedPostIds.has(String(post.id))) {
          article.classList.add("wall-post-can-delete");
          article.title = "Toque na publicação para mostrar a opção de apagar.";
          const remove = document.createElement("button");
          remove.type = "button"; remove.className = "wall-delete";
          remove.dataset.postId = String(post.id);
          remove.textContent = "−";
          remove.title = "Apagar minha publicação";
          remove.setAttribute("aria-label", "Apagar esta publicação");
          actions.append(remove);
          article.addEventListener("click", (event) => {
            if (event.target.closest("button")) return;
            article.classList.toggle("wall-post-actions-visible");
          });
        }
        footer.append(meta, actions); article.append(title, content, footer); postArea.append(article);
      });
    }
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const author = String(fd.get("author") || "").trim().slice(0, 28);
      const title = String(fd.get("title") || "").trim().slice(0, 60);
      const content = String(fd.get("content") || "").trim().slice(0, 400);
      if (author.length < 2 || title.length < 3 || content.length < 3) { $("wallStatus").textContent = "Preencha todos os campos com pelo menos 3 caracteres."; return; }
      if (/<\/?script|javascript:|onerror\s*=|onload\s*=/i.test(`${author} ${title} ${content}`)) { $("wallStatus").textContent = "Remova códigos ou marcações não permitidas antes de publicar."; return; }
      const submit = form.querySelector("button[type=submit]"); submit.disabled = true; submit.textContent = "PUBLICANDO...";
      const post = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, author, title, content, created_at: new Date().toISOString(), likes: 0 };
      try {
        if (window.communityDb) {
          const remote = await window.dbInsert("community_posts", { author, title, content, likes: 0, owner_token: ownerToken });
          const savedPost = remote || post;
          posts.unshift(savedPost); markPostAsOwned(savedPost.id);
          $("wallStatus").textContent = "Sua publicação foi adicionada ao mural compartilhado.";
        } else {
          posts.unshift(post); markPostAsOwned(post.id);
          $("wallStatus").textContent = "Sua publicação foi salva neste navegador.";
        }
        save(); render(); form.reset();
      } catch (error) {
        console.error("Falha ao publicar:", error); posts.unshift(post); markPostAsOwned(post.id); save(); render(); form.reset();
        $("wallStatus").textContent = "A conexão falhou. A publicação foi salva localmente neste navegador.";
      } finally { submit.disabled = false; submit.innerHTML = "PUBLICAR <span>↗</span>"; }
    });
    postArea.addEventListener("click", async (event) => {
      const button = event.target.closest(".wall-delete");
      if (!button) return;
      event.stopPropagation();
      const postId = String(button.dataset.postId || "");
      const post = posts.find((item) => String(item.id) === postId);
      if (!post || !ownedPostIds.has(postId)) return;
      if (!window.confirm("Quer mesmo apagar esta publicação? Essa ação não pode ser desfeita.")) return;

      button.disabled = true; button.textContent = "…";
      try {
        if (window.communityDb && /^\d+$/.test(postId)) {
          const deleted = await window.dbDeletePost(postId, ownerToken);
          if (!deleted) throw new Error("O mural não confirmou a exclusão desta publicação.");
        }
        posts = posts.filter((item) => String(item.id) !== postId);
        ownedPostIds.delete(postId); saveOwnedPostIds(ownedPostIds);
        save(); render();
        $("wallStatus").textContent = "Sua publicação foi apagada.";
      } catch (error) {
        console.error("Não foi possível apagar a publicação:", error);
        button.disabled = false; button.textContent = "−";
        $("wallStatus").textContent = "Não foi possível apagar no mural compartilhado. Confira se executou o arquivo supabase/schema.sql atualizado.";
      }
    });

    async function loadSharedPosts() {
      if (!window.communityDb) return;
      try {
        const remote = await window.dbLoad("community_posts");
        if (remote?.length) {
          const existing = new Set(posts.map((p) => String(p.id)));
          remote.forEach((p) => { if (!existing.has(String(p.id))) posts.push(p); });
          posts = posts.slice(0, 60); save(); render();
          $("wallStatus").textContent = "Mural conectado: publicações compartilhadas entre visitantes.";
        }
      } catch (error) { console.warn("Mural remoto indisponível:", error); }
    }
    render(); loadSharedPosts();
  }

  $("confirmChoice").addEventListener("click", confirmChoice);
  $("restartGame").addEventListener("click", restartGame);
  $("backToRoles").addEventListener("click", () => { window.location.href = "funcoes.html"; });
  renderDashboard();
  if (state.done || state.history.length >= missions.length) showRevelation();
  else {
    renderMission();
    // Se a página foi recarregada depois da confirmação, restaura o cartão de consequência.
    const savedDecision = state.history[state.current];
    if (savedDecision && savedDecision.missionIndex === state.current) {
      [...$("choiceList").children].forEach((button) => { button.disabled = true; });
      $("confirmChoice").disabled = true;
      $("selectionFeedback").textContent = "Sua decisão já foi registrada. Veja a consequência abaixo.";
      renderResult(savedDecision);
    }
  }
})();
