(() => {
  const STORAGE_KEY = "ums_notes_v1";
  const OWNER_KEY = "ums_note_owner_v1";
  const OWNED_IDS_KEY = "ums_owned_note_ids_v1";
  const board = document.getElementById("stickyBoard");
  const modal = document.getElementById("noteModal");
  const form = document.getElementById("noteForm");
  const feedback = document.getElementById("noteFeedback");
  const count = document.getElementById("noteCount");
  const colorClasses = ["yellow", "lilac", "blue", "orange", "pink"];
  const samples = [
    { id: "sample-1", author: "visitante", content: "A cultura periférica merece ser reconhecida e valorizada.", color: "yellow", sample: true },
    { id: "sample-2", author: "comunidade", content: "Mais espaço para artistas locais mostrarem seu trabalho.", color: "lilac", sample: true },
    { id: "sample-3", author: "voz local", content: "Acesso à arte também é acesso à educação e à identidade.", color: "blue", sample: true },
    { id: "sample-4", author: "visitante", content: "O Oziel tem histórias que merecem chegar a mais pessoas.", color: "orange", sample: true },
    { id: "sample-5", author: "comunidade", content: "Fortalecer a cultura é fortalecer a comunidade.", color: "pink", sample: true }
  ];
  let notes = readLocalNotes();
  const ownerToken = getOwnerToken();
  const ownedIds = readOwnedIds();

  function getOwnerToken() {
    let token = localStorage.getItem(OWNER_KEY);
    if (!token) {
      if (window.crypto?.randomUUID) token = window.crypto.randomUUID();
      else if (window.crypto?.getRandomValues) {
        const bytes = new Uint8Array(24);
        window.crypto.getRandomValues(bytes);
        token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
      } else {
        token = `${Date.now().toString(36)}-${Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      }
      localStorage.setItem(OWNER_KEY, token);
    }
    return token;
  }
  function readOwnedIds() {
    try {
      const parsed = JSON.parse(localStorage.getItem(OWNED_IDS_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch { return new Set(); }
  }
  function saveOwnedIds() {
    localStorage.setItem(OWNED_IDS_KEY, JSON.stringify([...ownedIds]));
  }
  function markAsOwned(id) {
    ownedIds.add(String(id));
    saveOwnedIds();
  }
  // Notes created locally before this delete feature can also be managed here.
  let migratedLocalNotes = false;
  notes.forEach((note) => {
    if (String(note.id || "").startsWith("local-") && !ownedIds.has(String(note.id))) {
      ownedIds.add(String(note.id));
      migratedLocalNotes = true;
    }
  });
  if (migratedLocalNotes) saveOwnedIds();

  function readLocalNotes() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(isValidNote) : [];
    } catch { return []; }
  }
  function isValidNote(note) {
    return note && typeof note.content === "string" && typeof note.author === "string" && colorClasses.includes(note.color);
  }
  function saveLocalNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, 40)));
  }
  function safeText(value, max) { return String(value ?? "").trim().slice(0, max); }
  function createNoteCard(note, index) {
    const article = document.createElement("article");
    article.className = `sticky-note note-${colorClasses.includes(note.color) ? note.color : "yellow"}`;
    article.style.setProperty("--note-order", index);
    const pin = document.createElement("span"); pin.className = "note-pin";
    const label = document.createElement("small"); label.textContent = note.sample ? `IDEIA #0${index + 1}` : "NOVA IDEIA";
    const paragraph = document.createElement("p"); paragraph.textContent = note.content;
    const author = document.createElement("b"); author.textContent = `— ${note.author}`;
    article.append(pin, label, paragraph, author);
    if (!note.sample) {
      const date = new Date(note.created_at || Date.now());
      const time = document.createElement("small");
      time.className = "note-time";
      time.textContent = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      article.append(time);

      if (ownedIds.has(String(note.id))) {
        article.classList.add("note-can-delete");
        article.title = "Toque no post-it para mostrar a opção de apagar.";
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "note-delete";
        removeButton.dataset.noteId = String(note.id);
        removeButton.setAttribute("aria-label", "Apagar este post-it");
        removeButton.title = "Apagar meu post-it";
        removeButton.textContent = "−";
        article.append(removeButton);
        article.addEventListener("click", (event) => {
          if (event.target.closest(".note-delete")) return;
          article.classList.toggle("note-actions-visible");
        });
      }
    }
    return article;
  }
  function renderBoard() {
    if (!board) return;
    const combined = [...notes.slice(0, 12).reverse(), ...samples];
    board.replaceChildren(...combined.map((note, index) => createNoteCard(note, index)));
    if (count) count.textContent = `${combined.length.toString().padStart(2, "0")} ideias no mural`;
  }
  function openModal() {
    modal?.classList.add("open"); modal?.setAttribute("aria-hidden", "false");
    window.setTimeout(() => document.getElementById("noteAuthor")?.focus(), 80);
  }
  function closeModal() {
    modal?.classList.remove("open"); modal?.setAttribute("aria-hidden", "true");
    feedback.textContent = "";
  }

  document.getElementById("openNoteModal")?.addEventListener("click", openModal);
  document.getElementById("closeNoteModal")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedback.textContent = "";
    const data = new FormData(form);
    const author = safeText(data.get("author"), 28);
    const content = safeText(data.get("content"), 150);
    const color = String(data.get("color") || "yellow");
    if (author.length < 2 || content.length < 3 || !colorClasses.includes(color)) {
      feedback.textContent = "Preencha seu nome e escreva uma ideia com pelo menos 3 caracteres.";
      return;
    }
    const note = { id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, author, content, color, created_at: new Date().toISOString() };
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true; submit.textContent = "PUBLICANDO...";
    try {
      let savedNote = note;
      if (window.communityDb) {
        const remote = await window.dbInsert("community_notes", { author, content, color, owner_token: ownerToken });
        if (remote) savedNote = remote;
      }
      notes.unshift(savedNote);
      markAsOwned(savedNote.id);
      saveLocalNotes(); renderBoard(); form.reset(); closeModal();
    } catch (error) {
      console.error("Não foi possível salvar no mural compartilhado:", error);
      notes.unshift(note);
      markAsOwned(note.id);
      saveLocalNotes(); renderBoard();
      feedback.textContent = "Não foi possível sincronizar agora. A ideia foi salva neste navegador.";
    } finally {
      submit.disabled = false; submit.innerHTML = "PUBLICAR NO MURAL <span>↗</span>";
    }
  });

  board?.addEventListener("click", async (event) => {
    const button = event.target.closest(".note-delete");
    if (!button) return;
    event.stopPropagation();

    const noteId = String(button.dataset.noteId || "");
    const note = notes.find((item) => String(item.id) === noteId);
    if (!note || !ownedIds.has(noteId)) return;
    if (!window.confirm("Quer mesmo apagar este post-it? Essa ação não pode ser desfeita.")) return;

    button.disabled = true;
    button.textContent = "…";
    try {
      if (window.communityDb && /^\d+$/.test(noteId)) {
        const deleted = await window.dbDeleteNote(noteId, ownerToken);
        if (!deleted) throw new Error("O mural não confirmou a exclusão deste post-it.");
      }
      notes = notes.filter((item) => String(item.id) !== noteId);
      ownedIds.delete(noteId);
      saveOwnedIds();
      saveLocalNotes();
      renderBoard();
    } catch (error) {
      console.error("Não foi possível apagar o post-it:", error);
      button.disabled = false;
      button.textContent = "−";
      window.alert("Não foi possível apagar este post-it no mural compartilhado. Confira se o arquivo supabase/schema.sql atualizado foi executado no seu projeto.");
    }
  });

  async function syncRemoteNotes() {
    if (!window.communityDb) return;
    try {
      const remote = await window.dbLoad("community_notes");
      if (remote?.length) {
        const known = new Set(notes.map((note) => String(note.id)));
        remote.forEach((item) => { if (!known.has(String(item.id))) notes.push(item); });
        notes = notes.slice(0, 40); saveLocalNotes(); renderBoard();
      }
    } catch (error) { console.warn("Mural compartilhado indisponível; usando dados locais.", error); }
  }

  const themeButton = document.getElementById("themeToggle");
  const themeIcon = themeButton?.querySelector(".theme-icon");
  function setTheme(theme) {
    document.body.classList.toggle("dark-theme", theme === "dark");
    if (themeIcon) themeIcon.textContent = theme === "dark" ? "☀" : "☾";
    localStorage.setItem("ums_theme", theme);
  }
  setTheme(localStorage.getItem("ums_theme") || "light");
  themeButton?.addEventListener("click", () => setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark"));

  const menuButton = document.getElementById("mobileMenuButton");
  menuButton?.addEventListener("click", () => {
    const nav = document.querySelector(".main-nav");
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!expanded)); nav?.classList.toggle("mobile-open", !expanded);
  });
  document.querySelectorAll(".main-nav a").forEach((link) => link.addEventListener("click", () => {
    document.querySelector(".main-nav")?.classList.remove("mobile-open"); menuButton?.setAttribute("aria-expanded", "false");
  }));

  const observer = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach((element) => observer ? observer.observe(element) : element.classList.add("revealed"));
  renderBoard(); syncRemoteNotes();
})();
