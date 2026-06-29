const API = 'https://portfolio-dp3p.onrender.com/api';

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  document.getElementById('scroll-top').classList.toggle('visible', window.scrollY > 400);
});

// ── Hamburger menu ──
document.getElementById('hamburger').addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('open');
});

// ── Scroll to top ──
document.getElementById('scroll-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Counter animation ──
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.target;
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current);
      if (current >= target) clearInterval(timer);
    }, 40);
  });
}
const aboutSection = document.getElementById('about');
new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) animateCounters();
}, { threshold: 0.4 }).observe(aboutSection);

// ── Load Projects from API ──
async function loadProjects() {
  const grid = document.getElementById('projects-grid');
  try {
    const res = await fetch(`${API}/projects`);
    const projects = await res.json();
    grid.innerHTML = '';
    if (!projects.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:2rem">No projects found. Add one below!</p>';
      return;
    }
    projects.forEach(p => grid.appendChild(createProjectCard(p)));
  } catch {
    grid.innerHTML = '<p style="color:#ff6b6b;grid-column:1/-1;text-align:center;padding:2rem">⚠ Could not load projects. Make sure the backend is running.</p>';
  }
}

function createProjectCard(p) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.innerHTML = `
    ${p.image
      ? `<img class="project-img" src="${p.image}" alt="${p.title}" loading="lazy">`
      : `<div class="project-img-placeholder"><i class="fas fa-code"></i></div>`}
    <div class="project-body">
      <h3 class="project-title">${p.title}</h3>
      <p class="project-desc">${p.description}</p>
      <div class="project-tech">
        ${(p.tech || []).map(t => `<span>${t}</span>`).join('')}
      </div>
      <div class="project-links">
        ${p.github ? `<a class="project-link" href="${p.github}" target="_blank"><i class="fab fa-github"></i> Code</a>` : ''}
        ${p.live   ? `<a class="project-link" href="${p.live}"   target="_blank"><i class="fas fa-external-link-alt"></i> Live</a>` : ''}
        <button class="btn-delete" data-id="${p._id}" title="Delete project">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
  card.querySelector('.btn-delete').addEventListener('click', () => deleteProject(p._id, card));
  return card;
}

async function deleteProject(id, card) {
  if (!confirm('Delete this project?')) return;
  try {
    await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'all 0.3s';
    setTimeout(() => { card.remove(); }, 300);
  } catch {
    alert('Failed to delete project.');
  }
}

// ── Add Project form ──
document.getElementById('project-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const msg  = document.getElementById('form-msg');
  const data = {
    title:       form.title.value.trim(),
    description: form.description.value.trim(),
    tech:        form.tech.value.split(',').map(t => t.trim()).filter(Boolean),
    github:      form.github.value.trim(),
    live:        form.live.value.trim(),
    image:       form.image.value.trim(),
  };
  try {
    const res = await fetch(`${API}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed');
    const project = await res.json();
    document.getElementById('projects-grid').appendChild(createProjectCard(project));
    form.reset();
    showMsg(msg, '✓ Project added successfully!', 'success');
    document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
  } catch {
    showMsg(msg, '✗ Failed to add project. Is the backend running?', 'error');
  }
});

// ── Contact form ──
document.getElementById('contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const msg  = document.getElementById('contact-msg');
  const data = {
    name:    form.name.value.trim(),
    email:   form.email.value.trim(),
    message: form.message.value.trim(),
  };
  try {
    const res = await fetch(`${API}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed');
    form.reset();
    showMsg(msg, '✓ Message sent! I\'ll get back to you soon.', 'success');
  } catch {
    showMsg(msg, '✗ Failed to send message. Is the backend running?', 'error');
  }
});

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = `form-msg ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'form-msg'; }, 5000);
}

// ── Scroll reveal animation ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.skill-category, .about-card, .contact-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ── Init ──
loadProjects();
