document.addEventListener('DOMContentLoaded', () => {
    if (window.VLibras) new window.VLibras.Widget('https://vlibras.gov.br/app');

    let tasks = JSON.parse(localStorage.getItem('neuroclarus_tasks')) || [
        { id: '1', title: 'Estudar para prova de FIA.', activities: [], time: null, completed: false },
        { id: '2', title: 'Estudar para prova de Estrutura de Dados.', activities: ['Revisar listas', 'Estudar pilhas', 'Praticar filas'], time: null, completed: false },
        { id: '3', title: 'Estudar sobre VM.', activities: ['Ler artigo sobre JVM'], time: null, completed: false }
    ];
    let history = JSON.parse(localStorage.getItem('neuroclarus_history')) || [];

    const container = document.getElementById('focusCardsContainer');
    const focusCount = document.getElementById('focusCount');
    const focaisCount = document.getElementById('focaisCount');
    const modalEl = document.getElementById('addFocusModal');
    const modal = new bootstrap.Modal(modalEl);

    function save() {
        localStorage.setItem('neuroclarus_tasks', JSON.stringify(tasks));
        localStorage.setItem('neuroclarus_history', JSON.stringify(history));
    }

    function renderCards() {
        const pending = tasks.filter(t => !t.completed);
        if (pending.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted text-center">Nenhum foco pendente.</p></div>';
            updateCounters();
            return;
        }

        let html = '';
        pending.forEach(task => {
            const badgeText = task.activities.length === 0 ? 'Focus Mode' : `+${task.activities.length} ${task.activities.length === 1 ? 'atividade' : 'atividades'}`;
            const activitiesList = task.activities.length ? `<ul class="list-unstyled mt-2 small text-secondary">` + task.activities.map(a => `<li><i class="fas fa-circle me-2" style="font-size:0.3rem; color:#7A6FF0;"></i>${a}</li>`).join('') + `</ul>` : '';

            html += `
                <div class="p-2">
                    <div class="card focus-card border-0 rounded-4 p-3 h-100" data-task-id="${task.id}">
                        <div class="d-flex align-items-start">
                            <i class="far fa-circle task-check me-3" data-id="${task.id}"></i>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <h5 class="fw-semibold mb-1">${task.title}</h5>
                                    <span class="badge bg-light rounded-pill">${badgeText}</span>
                                </div>
                                ${activitiesList}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
        updateCounters();
    }

    function updateCounters() {
        const pending = tasks.filter(t => !t.completed).length;
        const completed = tasks.filter(t => t.completed).length;
        focusCount.textContent = pending;
        focaisCount.textContent = completed;
    }

    container.addEventListener('click', (e) => {
        const icon = e.target.closest('.task-check');
        if (icon) {
            const id = icon.dataset.id;
            const task = tasks.find(t => t.id === id);
            if (task && !task.completed) {
                task.completed = true;
                history.push({ id: Date.now().toString(), title: task.title, activities: task.activities, completedAt: new Date().toISOString() });
                save();
                renderCards();
            }
        }
    });

    // Modal
    document.getElementById('saveFocusBtn').addEventListener('click', () => {
        const title = document.getElementById('focusTitle').value.trim();
        if (!title) return alert('Título obrigatório');
        const activities = Array.from(document.querySelectorAll('.activity-input')).map(i => i.value.trim()).filter(v => v);
        const time = document.getElementById('focusTime').value;
        const newTask = { id: Date.now().toString(), title, activities, time, completed: false };
        tasks.push(newTask);
        save();
        renderCards();
        modal.hide();
        document.getElementById('focusTitle').value = '';
        document.getElementById('focusTime').value = '';
        document.getElementById('activitiesContainer').innerHTML = `
            <div class="input-group mb-2">
                <input type="text" class="form-control rounded-pill activity-input" placeholder="Descreva a atividade">
                <button class="btn btn-outline-danger rounded-circle ms-2 d-none" type="button"><i class="fas fa-trash"></i></button>
            </div>
        `;
    });

    document.getElementById('addActivityBtn').addEventListener('click', () => {
        const container = document.getElementById('activitiesContainer');
        const div = document.createElement('div');
        div.className = 'input-group mb-2';
        div.innerHTML = `<input type="text" class="form-control rounded-pill activity-input" placeholder="Descreva a atividade">
                         <button class="btn btn-outline-danger rounded-circle ms-2" type="button"><i class="fas fa-trash"></i></button>`;
        container.appendChild(div);
        div.querySelector('button').addEventListener('click', () => div.remove());
        // Mostrar botão de remover na primeira linha também
        if (container.children.length > 1) {
            container.querySelectorAll('.btn-outline-danger').forEach(b => b.classList.remove('d-none'));
        }
    });

    renderCards();
});