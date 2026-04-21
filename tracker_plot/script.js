let instruments = [];
let currentFilter = 'all';

const instrumentsList = document.getElementById('InstrumentsList');
const instrumentNameInput = document.getElementById('instrumentName');
const addBtn = document.getElementById('addBtn');
const totalInstrSpan = document.getElementById('totalInstr');
const inProgressCountSpan = document.getElementById('inProgressCount');
const learnedCountSpan = document.getElementById('learnedCount');
const filterBtns = document.querySelectorAll('.filter-btn');

//сохраняем в память
function loadData() {
    const saved = localStorage.getItem('musicTracker');
    if (saved) {
        instruments = JSON.parse(saved);
    } else {
        instruments = [
            {
                id: Date.now() + 1,
                name: 'Акустическая гитара',
                status: 'in_progress',
                hours: 12,
                targetHours: 50
            },
            {
                id: Date.now() + 2,
                name: 'Пианино',
                status: 'learned',
                hours: 60,
                targetHours: 60
            },
            {
                id: Date.now() + 3,
                name: 'Укулеле',
                status: 'in_progress',
                hours: 8,
                targetHours: 40
            }
        ];
    }
}

function saveData() {
    localStorage.setItem('musicTracker', JSON.stringify(instruments));
} //сохраняем и выводим информацию в формате строк

//обновление статистики
function updateStats() {
    const total = instruments.length;
    const inProgress = instruments.filter(inst => inst.status === 'in_progress').length;
    const learned = instruments.filter(inst => inst.status === 'learned').length;
    
    totalInstrSpan.textContent = total;
    inProgressCountSpan.textContent = inProgress;
    learnedCountSpan.textContent = learned;
}

//прогресс в процентах
function getProgressPercentage(hours, targetHours) {
    if (targetHours === 0) return 0;
    const percentage = (hours / targetHours) * 100;
    return Math.min(percentage, 100);
} 

//обновление статуса инструмента
function updateStatusByHours(instrument) {
    if (instrument.hours >= instrument.targetHours) {
        instrument.status = 'learned';
    } else if (instrument.status === 'learned' && instrument.hours < instrument.targetHours) {
        instrument.status = 'in_progress';
    }
    return instrument;
}

//добавление часов
function addHours(instrumentId, hoursToAdd) {
    const instrument = instruments.find(inst => inst.id === instrumentId);
    if (instrument && instrument.status !== 'learned') {
        const newHours = instrument.hours + hoursToAdd;
        instrument.hours = Math.min(newHours, instrument.targetHours);
        updateStatusByHours(instrument);
        saveData();
        renderInstruments();
        updateStats();
    }
}

function markAsLearned(instrumentId) {
    const instrument = instruments.find(inst => inst.id === instrumentId);
    if (instrument) {
        instrument.hours = instrument.targetHours;
        instrument.status = 'learned';
        saveData();
        renderInstruments();
        updateStats();
    }
} //отметить как изученное

//удаление инструмента
function deleteInstrument(instrumentId) {
    if (confirm('Вы уверены, что хотите удалить этот инструмент?')) {
        instruments = instruments.filter(inst => inst.id !== instrumentId);
        saveData();
        renderInstruments();
        updateStats();
    }
}

function addInstrument() {
    const name = instrumentNameInput.value.trim();
    
    if (!name) {
        alert('Пожалуйста, введите название инструмента!');
        return;
    }
    
    if (name.length < 2) {
        alert('Название должно содержать минимум 2 символа!');
        return;
    }
    
    const newInstrument = {
        id: Date.now(),
        name: name,
        status: 'in_progress',
        hours: 0,
        targetHours: 50 //целевое количество часов по умолчанию
    };
    
    instruments.push(newInstrument);
    saveData();
    instrumentNameInput.value = '';
    renderInstruments();
    updateStats();
    
    //скролл к новому элементу
    setTimeout(() => {
        const newCard = document.querySelector(`.instrument-card:last-child`);
        if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

//создание карточки инструмента
function createInstrumentCard(instrument) {
    const card = document.createElement('div');
    card.className = 'instrument-card';
    
    const progress = getProgressPercentage(instrument.hours, instrument.targetHours);
    const isLearned = instrument.status === 'learned';
    
    card.innerHTML = `
        <div class="instrument-header">
            <div class="instrument-name">${escapeHtml(instrument.name)}</div>
            <div class="instrument-status status-${instrument.status}">
                ${instrument.status === 'in_progress' ? '🎯 В процессе' : '✅ Изучено'}
            </div>
        </div>
        
        <div class="progress-section">
            <div class="progress-label">
                <span>Прогресс: ${instrument.hours} / ${instrument.targetHours} ч</span>
                <span>${Math.round(progress)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
        </div>
        
        ${!isLearned ? `
            <div class="hours-input">
                <input type="number" id="hours-${instrument.id}" placeholder="Часы занятий" min="1" max="${instrument.targetHours - instrument.hours}" step="1">
                <button onclick="window.addHoursHandler(${instrument.id})">➕ Добавить часы</button>
            </div>
        ` : ''}
        
        <div class="instrument-actions">
            ${!isLearned ? `
                <button class="complete-btn" onclick="window.markAsLearnedHandler(${instrument.id})">
                    🏆 Отметить изученным
                </button>
            ` : ''}
            <button class="delete-btn" onclick="window.deleteInstrumentHandler(${instrument.id})">
                🗑️ Удалить
            </button>
        </div>
    `;
    
    return card;
}

//обработчики для глобального доступа
window.addHoursHandler = (id) => {
    const hoursInput = document.getElementById(`hours-${id}`);
    if (hoursInput) {
        let hours = parseInt(hoursInput.value);
        if (isNaN(hours) || hours <= 0) {
            alert('Пожалуйста, введите корректное количество часов (от 1)');
            return;
        }
        
        const instrument = instruments.find(inst => inst.id === id);
        if (instrument && instrument.hours + hours > instrument.targetHours) {
            alert(`Вы не можете добавить больше ${instrument.targetHours - instrument.hours} часов, так как цель - ${instrument.targetHours} часов`);
            return;
        }
        
        addHours(id, hours);
        hoursInput.value = '';
    }
};

window.markAsLearnedHandler = (id) => {
    if (confirm('Отметить инструмент как изученный?')) {
        markAsLearned(id);
    }
};

window.deleteInstrumentHandler = (id) => {
    deleteInstrument(id);
};

//фильтр инструментов
function getFilteredInstruments() {
    if (currentFilter === 'all') {
        return instruments;
    }
    return instruments.filter(inst => inst.status === currentFilter);
}

//отрисовка 
function renderInstruments() {
    const filtered = getFilteredInstruments();
    
    if (filtered.length === 0) {
        instrumentsList.innerHTML = `
            <div class="empty-state">
                Нет инструментов в этой категории<br>
                Добавьте новый инструмент, чтобы начать отслеживание!
            </div>
        `;
        return;
    }
    
    instrumentsList.innerHTML = '';
    filtered.forEach(instrument => {
        const card = createInstrumentCard(instrument);
        instrumentsList.appendChild(card);
    });
}

function setActiveFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(btn => {
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderInstruments();
} //обновление активного фильтра

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function init() {
    loadData();
    updateStats();
    renderInstruments();
    
    addBtn.addEventListener('click', addInstrument);
    instrumentNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addInstrument();
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveFilter(btn.dataset.filter);
        });
    });
}

init();