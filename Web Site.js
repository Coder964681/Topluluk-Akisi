const STORAGE_KEY = "forum_state_v3";

const initialState = {
  username: "",
  passwordHash: "",
  avatarDataUrl: "",
  posts: [
    {
      id: "p1",
      title: "Mobilde temiz bir topluluk arayuzu nasil olmali?",
      text: "Reddit tarzi butonlar + acilip kapanan yorum alanlari ile sade bir akis hedefliyorum.",
      author: "u/kullanici_01",
      avatar: "",
      createdAt: new Date().toISOString(),
      score: 128,
      vote: 0,
      saved: false,
      commentsOpen: false,
      comments: [
        {
          id: "c1",
          author: "u/alper",
          avatar: "",
          text: "Gayet temiz gorunuyor.",
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: "p2",
      title: "Yorumlarin kalici olmasi icin localStorage yeterli mi?",
      text: "Baslangic icin yeterli. Sonra veritabani ile genisletilebilir.",
      author: "u/ayse_dev",
      avatar: "",
      createdAt: new Date().toISOString(),
      score: 76,
      vote: 0,
      saved: false,
      commentsOpen: false,
      comments: [],
    },
  ],
};

let state = loadState();
let pendingAvatarDataUrl = state.avatarDataUrl || "";

const feedEl = document.getElementById("feed");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const avatarUploadInput = document.getElementById("avatar-upload");
const profileAvatar = document.getElementById("profile-avatar");
const loginStatus = document.getElementById("login-status");
const postForm = document.getElementById("post-form");
const postTitle = document.getElementById("post-title");
const postText = document.getElementById("post-text");
const refreshBtn = document.getElementById("refresh-btn");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.posts)) return structuredClone(initialState);

    const merged = structuredClone(initialState);
    merged.username = parsed.username || "";
    merged.passwordHash = parsed.passwordHash || "";
    merged.avatarDataUrl = parsed.avatarDataUrl || "";
    merged.posts = parsed.posts.map((post) => ({
      id: post.id || `p_${Date.now()}`,
      title: post.title || "",
      text: post.text || "",
      author: post.author || "u/misafir",
      avatar: post.avatar || "",
      createdAt: post.createdAt || new Date().toISOString(),
      score: Number.isFinite(post.score) ? post.score : 0,
      vote: post.vote === 1 || post.vote === -1 ? post.vote : 0,
      saved: Boolean(post.saved),
      commentsOpen: Boolean(post.commentsOpen),
      comments: Array.isArray(post.comments)
        ? post.comments.map((comment) => ({
            id: comment.id || `c_${Date.now()}`,
            author: comment.author || "u/misafir",
            avatar: comment.avatar || "",
            text: comment.text || "",
            createdAt: comment.createdAt || new Date().toISOString(),
          }))
        : [],
    }));
    return merged;
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatTime(iso) {
  const date = new Date(iso);
  return date.toLocaleString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function currentAuthor() {
  return state.username ? `u/${state.username}` : "u/misafir";
}

function currentAvatar() {
  return state.avatarDataUrl || "";
}

function fallbackText(author) {
  const first = author.replace("u/", "").trim().charAt(0);
  return (first || "U").toUpperCase();
}

function avatarMarkup(avatarSrc, author) {
  if (avatarSrc) {
    return `<img class="avatar" src="${avatarSrc}" alt="${escapeHtml(author)} avatar" />`;
  }
  return `<span class="avatar avatar-fallback">${escapeHtml(fallbackText(author))}</span>`;
}

function updateLoginUI() {
  if (state.username) {
    const passStatus = state.passwordHash ? "sifre kayitli" : "sifre yok";
    loginStatus.textContent = `Durum: u/${state.username} olarak giris yapildi (${passStatus})`;
    usernameInput.value = state.username;
  } else {
    loginStatus.textContent = "Durum: giris yok";
    usernameInput.value = "";
  }

  if (pendingAvatarDataUrl) {
    profileAvatar.src = pendingAvatarDataUrl;
    profileAvatar.style.display = "block";
  } else {
    profileAvatar.removeAttribute("src");
    profileAvatar.style.display = "none";
  }
}

function createPostHtml(post) {
  const commentsHtml = post.comments
    .map(
      (comment) => `
    <article class="comment-item">
      <div class="comment-head">
        ${avatarMarkup(comment.avatar, comment.author)}
        <p class="comment-meta">${comment.author} | ${formatTime(comment.createdAt)}</p>
      </div>
      <p class="comment-text">${escapeHtml(comment.text)}</p>
    </article>
  `
    )
    .join("");

  return `
    <article class="post" data-post-id="${post.id}">
      <div class="vote-box">
        <button class="vote up ${post.vote === 1 ? "active" : ""}" data-action="upvote">UP</button>
        <span class="score">${post.score}</span>
        <button class="vote down ${post.vote === -1 ? "active" : ""}" data-action="downvote">DN</button>
      </div>

      <div class="post-body">
        <div class="author-row">
          ${avatarMarkup(post.avatar, post.author)}
          <p class="meta">${post.author} | ${formatTime(post.createdAt)}</p>
        </div>
        <h4>${escapeHtml(post.title)}</h4>
        <p>${escapeHtml(post.text)}</p>

        <div class="actions">
          <button class="action" data-action="toggle-comments">Yorum ${post.comments.length}</button>
          <button class="action" data-action="share">Paylas</button>
          <button class="action ${post.saved ? "saved" : ""}" data-action="save">${post.saved ? "Kaydedildi" : "Kaydet"}</button>
        </div>

        <section class="comments ${post.commentsOpen ? "" : "hidden"}">
          <div class="comment-list">${commentsHtml || '<p class="meta">Henuz yorum yok.</p>'}</div>
          <form class="comment-form" data-comment-form>
            <textarea maxlength="300" placeholder="Yorum yaz" required></textarea>
            <button type="submit" class="action">Yorum Ekle</button>
          </form>
        </section>
      </div>
    </article>
  `;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render() {
  feedEl.innerHTML = state.posts.map(createPostHtml).join("");
  updateLoginUI();
}

function toggleVote(post, nextVote) {
  if (post.vote === nextVote) {
    post.vote = 0;
    post.score += nextVote === 1 ? -1 : 1;
    return;
  }
  if (post.vote === 0) {
    post.vote = nextVote;
    post.score += nextVote;
    return;
  }
  post.vote = nextVote;
  post.score += nextVote === 1 ? 2 : -2;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Dosya okunamadi"));
    reader.readAsDataURL(file);
  });
}

async function hashPassword(plain) {
  if (!plain) return "";
  if (!window.crypto || !window.crypto.subtle) {
    return btoa(plain);
  }
  const data = new TextEncoder().encode(plain);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

avatarUploadInput?.addEventListener("change", async (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Lutfen bir resim dosyasi sec.");
    return;
  }
  try {
    pendingAvatarDataUrl = await readFileAsDataUrl(file);
    updateLoginUI();
  } catch {
    alert("Profil fotografi okunamadi.");
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = usernameInput.value.trim();
  const plainPassword = passwordInput.value.trim();
  if (!name) return;

  state.username = name;
  if (plainPassword) {
    state.passwordHash = await hashPassword(plainPassword);
  }
  if (pendingAvatarDataUrl) {
    state.avatarDataUrl = pendingAvatarDataUrl;
  }

  saveState();
  passwordInput.value = "";
  updateLoginUI();
});

postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = postTitle.value.trim();
  const text = postText.value.trim();
  if (!title || !text) return;

  state.posts.unshift({
    id: `p_${Date.now()}`,
    title,
    text,
    author: currentAuthor(),
    avatar: currentAvatar(),
    createdAt: new Date().toISOString(),
    score: 1,
    vote: 1,
    saved: false,
    commentsOpen: false,
    comments: [],
  });

  saveState();
  postForm.reset();
  render();
});

feedEl.addEventListener("click", async (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const postEl = event.target.closest("[data-post-id]");
  if (!postEl) return;

  const postId = postEl.getAttribute("data-post-id");
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const action = actionEl.getAttribute("data-action");

  if (action === "upvote") {
    toggleVote(post, 1);
  }
  if (action === "downvote") {
    toggleVote(post, -1);
  }
  if (action === "save") {
    post.saved = !post.saved;
  }
  if (action === "toggle-comments") {
    post.commentsOpen = !post.commentsOpen;
  }
  if (action === "share") {
    const text = `${post.title} - ${post.author}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Paylasim metni panoya kopyalandi.");
    } catch {
      alert("Kopyalama yapilamadi.");
    }
  }

  saveState();
  render();
});

feedEl.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-comment-form]");
  if (!form) return;
  event.preventDefault();

  const postEl = event.target.closest("[data-post-id]");
  if (!postEl) return;

  const postId = postEl.getAttribute("data-post-id");
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;

  const textarea = form.querySelector("textarea");
  const text = textarea.value.trim();
  if (!text) return;

  post.comments.push({
    id: `c_${Date.now()}`,
    author: currentAuthor(),
    avatar: currentAvatar(),
    text,
    createdAt: new Date().toISOString(),
  });

  post.commentsOpen = true;
  saveState();
  render();
});

refreshBtn?.addEventListener("click", () => {
  location.reload();
});

render();
