document.addEventListener('DOMContentLoaded', () => {
  let focuses = JSON.parse(localStorage.getItem('neuroclarus_focuses')) || [];

  const pendingContainer = document.getElementById('pendingFocusContainer');
  const completedContainer = document.getElementById('completedFocusContainer');
  const pendingStats = document.getElementById('pendingStats');
  const completedStats = document.getElementById('completedStats');

  const focusModal = new bootstrap.Modal(document.getElementById('focusModal'));
  const focusForm = document.getElementById('focusForm');
  const focusTitle = document.getElementById('focusTitle');
  const focusTime = document.getElementById('focusTime');
  const activitiesListDiv = document.getElementById('activitiesList');
  const newActivityInput = document.getElementById('newActivityInput');
  const addActivityBtn = document.getElementById('addActivityBtn');

  let tempActivities = [];

  function save() {
    localStorage.setItem('neuroclarus_focuses', JSON.stringify(focuses));
  }

  function render() {
    const pending = focuses.filter(f => !f.completed).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const completed = focuses.filter(f => f.completed).sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt));

    // Pendentes
    if (pending.length) {
      pendingContainer.innerHTML = pending.map((f, i) => `
        <div class="focus-card ${i === 0 ? 'priority' : ''}" data-id="${f.id}">
          <div class="card-header">
            <input type="checkbox" class="focus-checkbox" data-id="${f.id}">
            <span class="focus-title">${escapeHtml(f.title)}</span>
            <div class="focus-actions">
              <button class="btn-focus-mode" data-id="${f.id}">Focus Mode</button>
              <button class="btn-delete" data-id="${f.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
          ${renderActivities(f.activities, f.id)}
        </div>
      `).join('');
    } else {
      pendingContainer.innerHTML = '<p class="text-muted text-center py-4">Nenhum foco pendente.</p>';
    }

    // Concluídos
    if (completed.length) {
      completedContainer.innerHTML = completed.map(f => `
        <div class="focus-card completed-card" data-id="${f.id}">
          <div class="card-header">
            <input type="checkbox" class="focus-checkbox" checked disabled>
            <span class="focus-title">${escapeHtml(f.title)}</span>
            <div class="focus-actions">
              <button class="btn-delete" data-id="${f.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
          ${renderActivities(f.activities, f.id)}
        </div>
      `).join('');
    } else {
      completedContainer.innerHTML = '<p class="text-muted text-center py-4">Nenhum foco concluído.</p>';
    }

    pendingStats.textContent = `${pending.length} focus`;
    completedStats.textContent = `${completed.length} focads`;

    attachEvents();
  }

  function renderActivities(activities, focusId) {
    if (!activities?.length) return '';
    const pending = activities.filter(a => !a.completed);
    if (!pending.length) return '';
    const shown = pending.slice(0, 3);
    let html = `<div class="activities-container">`;
    shown.forEach(a => {
      html += `<div class="activity-item">
        <input type="checkbox" class="activity-checkbox" data-focus-id="${focusId}" data-activity-id="${a.id}">
        <span class="activity-text">${escapeHtml(a.description)}</span>
      </div>`;
    });
    if (pending.length > 3) {
      html += `<div class="activity-counter">+ ${pending.length - 3} atividade${pending.length - 3 > 1 ? 's' : ''}</div>`;
    }
    html += `</div>`;
    return html;
  }

  function attachEvents() {
    document.querySelectorAll('.focus-checkbox:not([disabled])').forEach(cb => cb.addEventListener('change', toggleFocus));
    document.querySelectorAll('.activity-checkbox').forEach(cb => cb.addEventListener('change', toggleActivity));
    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', deleteFocus));
    document.querySelectorAll('.btn-focus-mode').forEach(b => b.addEventListener('click', goToFocus));
  }

  function toggleFocus(e) {
    const id = e.target.dataset.id;
    const focus = focuses.find(f => f.id === id);
    if (focus) {
      focus.completed = e.target.checked;
      focus.completedAt = focus.completed ? new Date().toISOString() : null;
      if (focus.completed) focus.activities.forEach(a => a.completed = true);
      save();
      render();
    }
  }

  function toggleActivity(e) {
    const fid = e.target.dataset.focusId;
    const aid = e.target.dataset.activityId;
    const focus = focuses.find(f => f.id === fid);
    const act = focus?.activities.find(a => a.id === aid);
    if (act) {
      act.completed = e.target.checked;
      save();
      render();
    }
  }

  function deleteFocus(e) {
    const id = e.currentTarget.dataset.id;
    focuses = focuses.filter(f => f.id !== id);
    save();
    render();
  }

  function goToFocus(e) {
    const id = e.currentTarget.dataset.id;
    window.location.href = `focusmode.html?focusId=${id}`;
  }

  // Modal
  function renderTempActivities() {
    if (!tempActivities.length) {
      activitiesListDiv.innerHTML = '<p class="text-muted small">Nenhuma atividade.</p>';
      return;
    }
    activitiesListDiv.innerHTML = tempActivities.map((a, i) => `
      <div class="activity-chip">
        <span>${escapeHtml(a.description)}</span>
        <button type="button" class="remove-activity" data-index="${i}"><i class="fas fa-times"></i></button>
      </div>
    `).join('');
    document.querySelectorAll('.remove-activity').forEach(b => b.addEventListener('click', (e) => {
      const idx = e.currentTarget.dataset.index;
      tempActivities.splice(idx, 1);
      renderTempActivities();
    }));
  }

  addActivityBtn.addEventListener('click', () => {
    const desc = newActivityInput.value.trim();
    if (desc) {
      tempActivities.push({ id: Date.now() + '-' + Math.random().toString(36), description: desc, completed: false });
      newActivityInput.value = '';
      renderTempActivities();
    }
  });

  focusForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = focusTitle.value.trim();
    if (!title) return;
    focuses.push({
      id: Date.now() + '-' + Math.random().toString(36),
      title,
      activities: tempActivities,
      time: focusTime.value || null,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    });
    save();
    render();
    focusModal.hide();
    focusForm.reset();
    tempActivities = [];
    renderTempActivities();
  });

  document.getElementById('focusModal').addEventListener('hidden.bs.modal', () => {
    focusForm.reset();
    tempActivities = [];
    renderTempActivities();
  });

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  render();
});