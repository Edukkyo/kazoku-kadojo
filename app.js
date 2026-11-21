const authDialog = document.querySelector("#auth-dialog");
const authForm = document.querySelector("#auth-form");
const nameField = document.querySelector("#name-field");
const authTitle = document.querySelector("#auth-title");
const submitAuth = document.querySelector("#submit-auth");
const formMessage = document.querySelector("#form-message");
const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");
const profileSection = document.querySelector("#perfil");
const mainNav = document.querySelector("#main-nav");
const menuToggle = document.querySelector(".menu-toggle");

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  const isRegister = mode === "register";
  nameField.hidden = !isRegister;
  nameField.querySelector("input").required = isRegister;
  authTitle.textContent = isRegister ? "Comece sua jornada." : "Entre para a família.";
  submitAuth.innerHTML = `${isRegister ? "Criar conta" : "Entrar"} <span aria-hidden="true">→</span>`;
  loginTab.setAttribute("aria-selected", String(!isRegister));
  registerTab.setAttribute("aria-selected", String(isRegister));
  formMessage.textContent = "";
  formMessage.classList.remove("is-error");
  const passwordField = authForm.elements.password;
  passwordField.autocomplete = isRegister ? "new-password" : "current-password";
  passwordField.minLength = isRegister ? 12 : 1;
  passwordField.placeholder = isRegister
    ? "12+ caracteres, com maiúscula, número e símbolo"
    : "Sua senha";
}

function showProfile(user) {
  document.querySelector("#profile-name").textContent = user.name;
  document.querySelector("#profile-email").textContent = user.email;
  document.querySelector("#sensei-event-form").hidden = user.role !== "sensei";
  profileSection.hidden = false;
  profileSection.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.querySelectorAll("[data-open-auth]").forEach((button) => {
  button.addEventListener("click", () => {
    setAuthMode(button.dataset.openAuth);
    if (authDialog.showModal) {
      authDialog.showModal();
    } else {
      authDialog.setAttribute("open", "");
    }
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.authTab));
});

document.querySelector(".dialog-close").addEventListener("click", () => authDialog.close());
authDialog.addEventListener("click", (event) => {
  if (event.target === authDialog) authDialog.close();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const email = String(formData.get("email")).trim().toLowerCase();
  const password = String(formData.get("password"));
  const name = String(formData.get("name") || "").trim();
  submitAuth.disabled = true;

  try {
    const response = await fetch(authMode === "register" ? "/api/register" : "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await response.json();

    if (!response.ok) {
      formMessage.textContent = data.error || "Não foi possível concluir a operação.";
      formMessage.classList.add("is-error");
      return;
    }

    authDialog.close();
    authForm.reset();
    showProfile(data);
  } catch (error) {
    formMessage.textContent = "Não foi possível conectar ao servidor.";
    formMessage.classList.add("is-error");
  } finally {
    submitAuth.disabled = false;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  profileSection.hidden = true;
  document.querySelector("#sensei-event-form").hidden = true;
  setAuthMode("login");
});

function formatEventDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

async function loadEvents() {
  const grid = document.querySelector("#event-grid");
  try {
    const response = await fetch("/api/events");
    const data = await response.json();
    if (!response.ok) throw new Error();

    if (!data.events.length) {
      grid.innerHTML = '<p class="events-empty">Nenhum evento publicado ainda. O Sensei anunciará o próximo desafio aqui.</p>';
      return;
    }

    grid.innerHTML = data.events.map((event) => `
      <article class="event-card">
        <img class="event-photo" src="${event.image_url}" alt="${event.title.replace(/[<>&"']/g, "")}">
        <div class="event-card-body">
          <time class="event-date" datetime="${event.event_date}">${formatEventDate(event.event_date)}</time>
          <h3>${event.title.replace(/[<>&"']/g, "")}</h3>
        </div>
      </article>
    `).join("");
  } catch (error) {
    grid.innerHTML = '<p class="events-empty">Não foi possível carregar os eventos agora.</p>';
  }
}

document.querySelector("#sensei-event-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#event-form-message");
  const submit = document.querySelector("#publish-event");
  submit.disabled = true;
  message.textContent = "";
  message.classList.remove("is-error");

  try {
    const response = await fetch("/api/events", {
      method: "POST",
      body: new FormData(form)
    });
    const data = await response.json();
    if (!response.ok) {
      message.textContent = data.error || "Não foi possível publicar o evento.";
      message.classList.add("is-error");
      return;
    }
    form.reset();
    message.textContent = "Evento publicado para os alunos.";
    await loadEvents();
  } catch (error) {
    message.textContent = "Não foi possível conectar ao servidor.";
    message.classList.add("is-error");
  } finally {
    submit.disabled = false;
  }
});

async function restoreSession() {
  try {
    const response = await fetch("/api/me");
    const data = await response.json();
    if (data.user) showProfile(data.user);
  } catch (error) {
    profileSection.hidden = true;
  }
}

restoreSession();
loadEvents();

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#current-year").textContent = new Date().getFullYear();
