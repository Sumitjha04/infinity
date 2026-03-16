// Basic shared JS for the Infinity community site

// Update footer year
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Splash intro (Welcome to Infinity)
const splash = document.getElementById("splash");
if (splash) {
  const MIN_SHOW_MS = 650;
  const HIDE_ANIM_MS = 600;
  const startedAt = Date.now();

  function hideSplash() {
    splash.classList.add("is-hiding");
    window.setTimeout(() => {
      splash.remove();
    }, HIDE_ANIM_MS);
  }

  // Show at least MIN_SHOW_MS, then hide when the page is ready
  const remaining = Math.max(0, MIN_SHOW_MS - (Date.now() - startedAt));
  window.setTimeout(() => {
    if (document.readyState === "complete") {
      hideSplash();
    } else {
      window.addEventListener("load", hideSplash, { once: true });
    }
  }, remaining);
}

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

// IntersectionObserver for scroll animations
const animatedEls = document.querySelectorAll(".animate-in");
if ("IntersectionObserver" in window && animatedEls.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  animatedEls.forEach((el) => observer.observe(el));
} else {
  animatedEls.forEach((el) => el.classList.add("is-visible"));
}

// Smooth-scroll for same-page anchor links (if any)
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const targetId = link.getAttribute("href") || "";
    if (targetId.length > 1) {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

// Events page: registration + simple pricing + backend save
const registrationForm = document.getElementById("registrationForm");
const eventSelect = document.getElementById("eventSelect");
const ticketPriceEl = document.getElementById("ticketPrice");
const totalPriceEl = document.getElementById("totalPrice");

const BASE_TICKET_PRICE = 299;

function updateTotalPrice() {
  if (!totalPriceEl) return;
  const form = registrationForm;
  if (!form) return;
  const seatsInput = form.querySelector('input[name="seats"]');
  const seats = seatsInput ? parseInt(seatsInput.value || "1", 10) : 1;
  const total = BASE_TICKET_PRICE * (Number.isNaN(seats) ? 1 : seats);
  if (ticketPriceEl) {
    ticketPriceEl.textContent = `₹${BASE_TICKET_PRICE} / seat`;
  }
  totalPriceEl.textContent = `₹${total}`;
}

if (registrationForm) {
  registrationForm.addEventListener("input", (e) => {
    const target = e.target;
    if (target && target.name === "seats") {
      updateTotalPrice();
    }
  });

  registrationForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(registrationForm);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const eventId = (formData.get("event") || "").toString();
    const seats = parseInt((formData.get("seats") || "1").toString(), 10) || 1;

    if (!name || !email || !eventId) {
      alert("Please fill in all required fields.");
      return;
    }

    const total = BASE_TICKET_PRICE * seats;

    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        event: eventId,
        seats,
        amount: total
      })
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Failed to save registration.");
        }
        alert(
          "Registration successful! We have saved your details.\n" +
            "You will receive Paytm payment instructions from the Infinity team."
        );
        registrationForm.reset();
        updateTotalPrice();
      })
      .catch((err) => {
        console.error(err);
        alert("Something went wrong while saving your registration. Please try again.");
      });
  });

  updateTotalPrice();
}

// Click on upcoming event cards to auto-select the event in the form
if (eventSelect) {
  const upcomingCards = document.querySelectorAll(".event-card.upcoming");
  upcomingCards.forEach((card) => {
    card.addEventListener("click", () => {
      const eventId = card.getAttribute("data-event-id");
      if (eventId) {
        eventSelect.value = eventId;
        upcomingCards.forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        eventSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
}

// Community page: WhatsApp link + local-only demo chat
const whatsappLink = document.getElementById("whatsappLink");
if (whatsappLink) {
  // TODO: replace this with your REAL WhatsApp community invite URL
  const placeholderWhatsAppUrl = "https://chat.whatsapp.com/your-community-link-here";
  whatsappLink.href = placeholderWhatsAppUrl;
}

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

if (chatForm && chatInput && chatMessages) {
  function appendMessage(text, self = true) {
    const msg = document.createElement("div");
    msg.className = "chat-message" + (self ? " self" : "");
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Load from localStorage (local-only demo)
  const stored = window.localStorage.getItem("community-demo-chat");
  if (stored) {
    try {
      const messages = JSON.parse(stored);
      if (Array.isArray(messages)) {
        messages.forEach((m) => appendMessage(m.text, m.self));
      }
    } catch {
      // ignore parse errors
    }
  }

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    appendMessage(text, true);

    const existing = window.localStorage.getItem("community-demo-chat");
    let list = [];
    if (existing) {
      try {
        list = JSON.parse(existing) || [];
      } catch {
        list = [];
      }
    }
    list.push({ text, self: true });
    window.localStorage.setItem("community-demo-chat", JSON.stringify(list));

    chatInput.value = "";
  });
}

