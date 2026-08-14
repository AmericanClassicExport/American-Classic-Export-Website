/* Browser-only email setup. Fill in these three public EmailJS values to activate both forms. */
const EMAILJS_CONFIG = {
  publicKey: "5KeMILnB7t54HC34s",
  serviceId: "service_6nahu64",
  templateId: "template_i4qo0rz",
};

const mainLinks = [
  ["index.html", "Home"],
  ["about.html", "About"],
  ["services.html", "Services"],
  ["how-it-works.html", "How It Works"],
  ["dealers.html", "Become a Dealer Partner"],
  ["recently-sourced.html", "Recently Sourced"],
  ["faq.html", "FAQ"],
];

const hasEmailJsConfig = Object.values(EMAILJS_CONFIG).every(Boolean);
const thanks =
  "Thank you! We've received your request. We'll contact you within 48 hours to discuss your search and the next steps.";

function renderShell() {
  const current = location.pathname.split("/").pop() || "index.html";
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");
  const links = mainLinks
    .map(
      ([href, label]) =>
        `<a class="${href === current ? "active" : ""}" href="${href}">${label}</a>`,
    )
    .join("");

  if (header) {
    header.innerHTML = `
      <a class="brand" href="index.html" aria-label="American Classic Export home"><img class="brand-mark" src="assets/Vectorized.svg" alt="American Classic Export logo" /><span class="brand-name">American Classic <em>Export</em></span></a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav"><span></span><span></span></button>
      <nav id="main-nav" class="main-nav" aria-label="Primary navigation">${links}<a class="nav-cta" href="car-finder.html">Find My Classic <span>↗</span></a></nav>`;
  }
  if (footer) {
    footer.innerHTML = `
      <div class="wrapper footer-cta-wrap"><a class="footer-cta" href="car-finder.html">FIND MY CLASSIC <span>→</span></a></div>
      <div class="wrapper footer-bottom"><p>© <span id="current-year"></span> American Classic Export Services LLC</p><div><a href="mailto:dennis@americanclassicexport.com">dennis@americanclassicexport.com</a><a href="https://www.facebook.com/profile.php?id=61593334014338" target="_blank" rel="noreferrer">Facebook</a></div></div>`;
  }
}

function setStatus(form, message, type = "") {
  const status = form.querySelector(".form-status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", type === "error");
}

function updateContactMethod(form) {
  const method = form.elements.contact_method;
  const detail = form.elements.contact_detail;
  if (!method || !detail) return;
  detail.required = Boolean(method.value && method.value !== "Email");
  detail.placeholder = detail.required
    ? `Your ${method.value} details *`
    : "Optional if email is preferred";
  if (detail.required && !detail.previousElementSibling?.classList.contains("required-mark")) {
    const mark = document.createElement("span");
    mark.className = "required-mark";
    mark.textContent = " *";
    detail.parentElement.insertBefore(mark, detail);
  }
}

async function sendForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = form.querySelector(".submit-button");
  if (!hasEmailJsConfig) {
    setStatus(
      form,
      "This prototype is ready for EmailJS delivery. Add the three EmailJS IDs in app.js to activate sending.",
      "error",
    );
    return;
  }
  if (!window.emailjs) {
    setStatus(
      form,
      "The email service could not be loaded. Please check your internet connection and try again.",
      "error",
    );
    return;
  }
  const previous = button.innerHTML;
  const fields = Object.fromEntries(new FormData(form).entries());
  const hiddenFields = {
    name: fields.from_name || "American Classic Export inquiry",
    time: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
    message: Object.entries(fields)
      .filter(([key]) => !["name", "time", "message"].includes(key) && fields[key])
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  };
  Object.entries(hiddenFields).forEach(([name, value]) => {
    let input = form.querySelector(`input[name="${name}"]`);
    if (!input) { input = document.createElement("input"); input.type = "hidden"; input.name = name; form.appendChild(input); }
    input.value = value;
  });
  button.disabled = true;
  button.innerHTML = "Sending <span>…</span>";
  setStatus(form, "");
  try {
    await window.emailjs.sendForm(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      form,
    );
    form.reset();
    updateContactMethod(form);
    setStatus(form, thanks);
  } catch (error) {
    console.error("Email form delivery failed", error);
    setStatus(
      form,
      `We couldn't send your request just now (${error?.text || error?.status || "EmailJS error"}). Please try again or email dennis@americanclassicexport.com.`,
      "error",
    );
  } finally {
    button.disabled = false;
    button.innerHTML = previous;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderShell();
  document.getElementById("current-year")?.append(new Date().getFullYear());
  document.body.classList.add("loaded");

  if (hasEmailJsConfig && window.emailjs) {
    window.emailjs.init({
      publicKey: EMAILJS_CONFIG.publicKey,
      limitRate: { id: "american-classic-export", throttle: 10000 },
    });
  }

  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  navToggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav?.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      document.body.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === "_blank"
    )
      return;
    const destination = new URL(link.href, location.href);
    const sameSitePage =
      destination.origin === location.origin &&
      destination.pathname !== location.pathname &&
      destination.pathname.endsWith(".html");
    if (!sameSitePage) return;
    event.preventDefault();
    document.body.classList.add("page-leaving");
    window.setTimeout(() => {
      location.href = destination.href;
    }, 210);
  });

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", sendForm);
    form.elements.contact_method?.addEventListener("change", () =>
      updateContactMethod(form),
    );
    updateContactMethod(form);
  });

  document.querySelectorAll(".faq details").forEach((detail) => {
    const summary = detail.querySelector("summary");
    if (!summary) return;
    const answer = document.createElement("div");
    answer.className = "faq-answer";
    Array.from(detail.children).forEach((child) => {
      if (child !== summary) answer.appendChild(child);
    });
    detail.appendChild(answer);
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (detail.dataset.animating === "true") return;
      detail.dataset.animating = "true";
      if (detail.open) {
        detail.classList.add("faq-closing");
        answer.style.height = `${answer.scrollHeight}px`;
        requestAnimationFrame(() => { answer.style.height = "0px"; });
        const closeAnswer = (event) => {
          if (event.propertyName !== "height") return;
          answer.removeEventListener("transitionend", closeAnswer);
          detail.open = false;
          detail.classList.remove("faq-closing");
          answer.style.height = "";
          detail.dataset.animating = "false";
        };
        answer.addEventListener("transitionend", closeAnswer);
      } else {
        detail.open = true;
        answer.style.height = "0px";
        requestAnimationFrame(() => { answer.style.height = `${answer.scrollHeight}px`; });
        const openAnswer = (event) => {
          if (event.propertyName !== "height") return;
          answer.removeEventListener("transitionend", openAnswer);
          answer.style.height = "auto";
          detail.dataset.animating = "false";
        };
        answer.addEventListener("transitionend", openAnswer);
      }
    });
  });

  document.querySelectorAll("label").forEach((label) => {
    const control = label.querySelector("input, select, textarea");
    if (control?.required && !label.querySelector(".required-mark")) {
      const mark = document.createElement("span");
      mark.className = "required-mark";
      mark.textContent = " *";
      label.insertBefore(mark, control);
    }
  });

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.1, rootMargin: "0px 0px -25px" },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((element) => observer.observe(element));
});
