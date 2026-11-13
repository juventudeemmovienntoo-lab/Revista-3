(() => {
  const MAX_SELECTED = 2;
  const buttons = [...document.querySelectorAll(".role-card")];
  const count = document.getElementById("selectedCount");
  const hint = document.getElementById("roleHint");
  const continueButton = document.getElementById("continueToGame");
  const selected = new Set();
  const roleNames = {
    urbanista: "Urbanista comunitário",
    educador: "Educador social",
    saude: "Agente de saúde",
    cultura: "Produtor cultural",
    articulador: "Articulador comunitário",
    comunicacao: "Comunicador local"
  };

  function render() {
    count.textContent = String(selected.size).padStart(2, "0");
    continueButton.disabled = selected.size !== MAX_SELECTED;
    hint.classList.toggle("valid", selected.size === MAX_SELECTED);
    hint.innerHTML = selected.size === MAX_SELECTED
      ? '<span class="hint-dot"></span> Equipe formada! Você já pode começar.'
      : '<span class="hint-dot"></span> Selecione exatamente duas funções para continuar.';
    buttons.forEach((button) => {
      const active = selected.has(button.dataset.role);
      button.classList.toggle("selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    const role = button.dataset.role;
    if (selected.has(role)) selected.delete(role);
    else if (selected.size < MAX_SELECTED) selected.add(role);
    else {
      hint.innerHTML = '<span class="hint-dot"></span> Você já selecionou duas funções. Retire uma para trocar.';
      hint.classList.remove("valid");
      return;
    }
    render();
  }));

  continueButton.addEventListener("click", () => {
    if (selected.size !== MAX_SELECTED) return;
    const roles = [...selected];
    localStorage.setItem("ums_roles", JSON.stringify(roles));
    localStorage.removeItem("ums_game_state");
    localStorage.setItem("ums_role_names", JSON.stringify(roles.map((role) => roleNames[role])));
    window.location.href = "jogo.html";
  });
  render();
})();
