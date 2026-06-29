'use strict';
/* app.js — runs after defer, DOM is ready */

// ── Year ────────────────────────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ── Mobile nav ──────────────────────────────────────────
const menuToggle = document.getElementById('menuToggle');
const navLinks   = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ── Passive scroll: navbar shadow (passive = no janky blocking) ──
const navbar = document.getElementById('navbar');
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    navbar.style.boxShadow = scrollY > 20 ? '0 2px 20px rgba(0,0,0,.4)' : '';
    ticking = false;
  });
}, { passive: true });

// ── Active nav highlight via IntersectionObserver ───────
const sections = document.querySelectorAll('section[id]');
const navAs    = navLinks.querySelectorAll('a');
const navIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navAs.forEach(a => a.classList.remove('active'));
    const match = navLinks.querySelector(`a[href="#${e.target.id}"]`);
    if (match) match.classList.add('active');
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => navIO.observe(s));

// ── Scroll reveal ────────────────────────────────────────
const revealIO = new IntersectionObserver((entries, obs) => {
  entries.forEach((e, i) => {
    if (!e.isIntersecting) return;
    // stagger siblings slightly
    setTimeout(() => e.target.classList.add('visible'), i * 50);
    obs.unobserve(e.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.about-grid, .about-stats .stat, .section-title, .contact-info, .contact-form'
).forEach(el => { el.classList.add('reveal'); revealIO.observe(el); });

// ── Skill bar animation via IntersectionObserver ─────────
// Fires once when skills section scrolls into view
const skillsSection = document.getElementById('skills');
const barIO = new IntersectionObserver((entries, obs) => {
  if (!entries[0].isIntersecting) return;
  // scaleX is GPU-composited — zero layout/paint cost
  document.querySelectorAll('.skill-fill').forEach(el => {
    el.style.transform = `scaleX(${el.dataset.level / 100})`;
  });
  obs.disconnect();
}, { threshold: 0.2 });
barIO.observe(skillsSection);

// ── XSS-safe text helper ─────────────────────────────────
function safe(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Parallel API fetch ────────────────────────────────────
// Fire both at once — no waterfall, runs in idle time
const _ric = window.requestIdleCallback || (cb => setTimeout(cb, 1));
_ric(() => {
  Promise.allSettled([
    fetch('/api/skills',   { signal: AbortSignal.timeout(4000) }).then(r => r.ok ? r.json() : []),
    fetch('/api/projects', { signal: AbortSignal.timeout(4000) }).then(r => r.ok ? r.json() : [])
  ]).then(([sr, pr]) => {
    renderSkills(sr.status   === 'fulfilled' ? sr.value : []);
    renderProjects(pr.status === 'fulfilled' ? pr.value : []);
  });
});

// ── Render skills ────────────────────────────────────────
function renderSkills(skills) {
  const c = document.getElementById('skills-container');
  if (!skills.length) { c.innerHTML = "<p style='color:var(--muted)'>No skills found.</p>"; return; }

  // Build HTML string once — single innerHTML write, no multiple reflows
  c.innerHTML = skills.map(s => `
    <div class="skill-card reveal">
      <div class="skill-header">
        <span class="skill-name">${safe(s.name)}</span>
        <span class="skill-level">${safe(s.level)}%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-fill" data-level="${safe(s.level)}"></div>
      </div>
      <div class="skill-category">${safe(s.category)}</div>
    </div>
  `).join('');

  // Observe new cards for reveal
  c.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));
}

// ── Render projects ──────────────────────────────────────
function renderProjects(projects) {
  const c = document.getElementById('projects-container');
  if (!projects.length) { c.innerHTML = "<p style='color:var(--muted)'>No projects found.</p>"; return; }

  c.innerHTML = projects.map(p => {
    const tags = (Array.isArray(p.tech) ? p.tech : (p.tech||'').split(','))
      .map(t => `<span class="tech-tag">${safe(t.trim())}</span>`).join('');
    return `
      <article class="project-card reveal">
        ${p.featured ? '<p class="project-featured">★ Featured</p>' : ''}
        <h3 class="project-title">${safe(p.title)}</h3>
        <p class="project-desc">${safe(p.description)}</p>
        <div class="project-tech">${tags}</div>
        <div class="project-links">
          ${p.github ? `<a href="${safe(p.github)}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
          ${p.demo   ? `<a href="${safe(p.demo)}"   target="_blank" rel="noopener">Live Demo ↗</a>` : ''}
        </div>
      </article>`;
  }).join('');

  c.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));
}

// ── Contact form ─────────────────────────────────────────
const form      = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const formMsg   = document.getElementById('form-msg');

function setMsg(text, type) {
  formMsg.textContent = text;
  formMsg.className   = `form-message${type ? ' ' + type : ''}`;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const name    = document.getElementById('fname').value.trim();
  const email   = document.getElementById('femail').value.trim();
  const message = document.getElementById('fmessage').value.trim();

  if (!name || !email || !message) { setMsg('Please fill in all fields.', 'error'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg('Enter a valid email.', 'error'); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  setMsg('', '');

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message }),
      signal: AbortSignal.timeout(6000)
    });
    const result = await res.json();
    if (res.ok) {
      setMsg("✓ Message sent! I'll get back to you soon.", 'success');
      form.reset();
    } else {
      throw new Error(result.error || 'Server error');
    }
  } catch (err) {
    setMsg('✗ ' + (err.message || 'Something went wrong. Please try again.'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
});
