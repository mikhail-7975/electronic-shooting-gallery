document.addEventListener('DOMContentLoaded', function() {
    const exercisesList = document.getElementById('exercisesList');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const completeExerciseBtn = document.getElementById('completeExerciseBtn');
    const clearExercisesBtn = document.getElementById('clearExercisesBtn');
    const modal = document.getElementById('addExerciseModal');
    const closeBtn = document.querySelector('.close');
    const confirmAddBtn = document.getElementById('confirmAddExercise');
    const cancelAddBtn = document.getElementById('cancelAddExercise');
    const exerciseNameInput = document.getElementById('exerciseName');
    const exerciseCommentInput = document.getElementById('exerciseComment');
    const exerciseColorInput = document.getElementById('exerciseColor');
    const targetCanvas = document.getElementById('targetCanvas');
    const targetImage = document.getElementById('targetImage');

    let ctx = targetCanvas.getContext('2d');
    let currentExerciseId = null;
    let canAddHits = false;

    // Инициализация canvas
    function initCanvas() {
        targetCanvas.width = targetImage.width;
        targetCanvas.height = targetImage.height;
        redrawHits();
    }

    // Загрузка изображения мишени
    targetImage.onload = function() {
        initCanvas();
    };

    // Если изображение уже загружено
    if (targetImage.complete) {
        initCanvas();
    }

    // Отрисовка попаданий
    function redrawHits() {
        ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

        // Получаем текущие попадания с сервера
        fetch('/')
            .then(() => {
                // В реальном приложении здесь был бы запрос к API для получения попаданий
                const hits = [];

                hits.forEach(hit => {
                    if (hit.exercise_id === currentExerciseId) {
                        drawHit(hit.x, hit.y, hit.color);
                    }
                });
            });
    }

    // Рисуем одно попадание
    function drawHit(x, y, color) {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Загрузка упражнений при старте
    loadExercises();

    // Открытие модального окна
    addExerciseBtn.addEventListener('click', function() {
        exerciseNameInput.value = '';
        exerciseCommentInput.value = '';
        exerciseColorInput.value = 'red';
        modal.style.display = 'block';
        exerciseNameInput.focus();
    });

    // Закрытие модального окна
    function closeModal() {
        modal.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeModal);
    cancelAddBtn.addEventListener('click', closeModal);

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Добавление упражнения
    confirmAddBtn.addEventListener('click', function() {
        const exerciseName = exerciseNameInput.value.trim();
        const exerciseComment = exerciseCommentInput.value.trim();
        const exerciseColor = exerciseColorInput.value;

        if (exerciseName) {
            fetch('/add_exercise', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `name=${encodeURIComponent(exerciseName)}&comment=${encodeURIComponent(exerciseComment)}&color=${encodeURIComponent(exerciseColor)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentExerciseId = data.current_exercise;
                    canAddHits = true;
                    updateButtonsState();
                    renderExercises(data.exercises);
                    closeModal();
                }
            });
        } else {
            alert('Пожалуйста, введите название упражнения');
        }
    });

    // Завершение упражнения
    completeExerciseBtn.addEventListener('click', function() {
        fetch('/complete_exercise', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentExerciseId = null;
                canAddHits = false;
                updateButtonsState();
            }
        });
    });

    // Очистка упражнений
    clearExercisesBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите удалить все упражнения?')) {
            fetch('/clear_exercises', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentExerciseId = null;
                    canAddHits = false;
                    updateButtonsState();
                    renderExercises([]);
                    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
                }
            });
        }
    });

    // Обработка кликов по мишени
    targetCanvas.addEventListener('click', function(e) {
        if (!canAddHits || !currentExerciseId) return;

        const rect = targetCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        fetch('/add_hit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `x=${x}&y=${y}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                drawHit(x, y, data.hits[data.hits.length - 1].color);
                updateExerciseStats();
            }
        });
    });

    // Обновление состояния кнопок
    function updateButtonsState() {
        addExerciseBtn.disabled = canAddHits;
        completeExerciseBtn.disabled = !canAddHits;
    }

    // Обновление статистики упражнения
    function updateExerciseStats() {
        // В реальном приложении здесь можно обновлять счет и другую статистику
    }

    // Загрузка упражнений с сервера
    function loadExercises() {
        fetch('/')
            .then(response => response.text())
            .then(() => {
                // В реальном приложении здесь был бы запрос к API для получения упражнений
                renderExercises([]);
            });
    }

    // Отрисовка списка упражнений
    function renderExercises(exercises) {
        exercisesList.innerHTML = '';

        if (exercises.length === 0) {
            exercisesList.innerHTML = '<p class="no-exercises">Нет упражнений</p>';
            return;
        }

        exercises.forEach((exercise, index) => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'exercise-item';

            const colorCircle = `<span class="exercise-color" style="background-color: ${exercise.color}"></span>`;
            const hitCount = 0; // В реальном приложении нужно считать попадания

            exerciseItem.innerHTML = `
                <div class="exercise-info">
                    <div class="exercise-name">${colorCircle}${exercise.name}</div>
                    ${exercise.comment ? `<div class="exercise-comment">${exercise.comment}</div>` : ''}
                    <div class="exercise-hits">Попаданий: ${hitCount}</div>
                </div>
                <div class="exercise-score">${exercise.score} очков</div>
            `;

            exercisesList.appendChild(exerciseItem);
        });
    }
});