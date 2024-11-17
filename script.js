document.addEventListener('DOMContentLoaded', function () {
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const closeModal = document.getElementsByClassName('close')[0];
    const taskForm = document.getElementById('taskForm');
    const taskColumns = {
        'toDo': document.getElementById('toDo'),
        'inProgress': document.getElementById('inProgress'),
        'complete': document.getElementById('complete')
    };
    const todoCount = document.getElementById('todoCount');
    const inProgressCount = document.getElementById('inProgressCount');
    const completeCount = document.getElementById('completeCount');

    let taskHistory = [];
    let historyPosition = -1;
    const maxHistory = 20;

    function updateTaskCounts() {
        todoCount.textContent = taskColumns.toDo.children.length;
        inProgressCount.textContent = taskColumns.inProgress.children.length;
        completeCount.textContent = taskColumns.complete.children.length;
    }

    const taskDetailsModal = document.getElementById('taskDetailsModal');
    const closeDetailsModal = document.getElementsByClassName('close-details')[0];
    const taskDetailsContent = document.getElementById('taskDetailsContent');
    const tourModal = document.getElementById('tourModal');
    const startTourBtn = document.getElementById('startTourBtn');
    const skipTourBtn = document.getElementById('skipTourBtn');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const renameModal = document.getElementById('renameModal');
    const closeRenameModal = document.getElementsByClassName('close-rename')[0];
    const renameForm = document.getElementById('renameForm');
    const fileNameInput = document.getElementById('fileNameInput');
    const exportBtn = document.getElementById('exportBtn');
    const shareBtn = document.getElementById('shareBtn');
    const searchTasks = document.getElementById('searchTasks');
    const filterTasksBtn = document.getElementById('filterTasksBtn');
    const filterModal = document.getElementById('filterModal');
    const closeFilterModal = document.getElementsByClassName('close-filter')[0];
    const filterForm = document.getElementById('filterForm');
    const filterKeyword = document.getElementById('filterKeyword');
    const clearFilterModalBtn = document.getElementById('clearFilterModalBtn');
    const undoBtn = document.getElementById('undoBtn');
    let currentTask = null;
    let fileName = 'file_name';

    // Show tour modal on page load
    tourModal.style.display = 'block';

    // Start the tour
    startTourBtn.onclick = function () {
        tourModal.style.display = 'none';
        introJs().setOptions({
            steps: [
                {
                    intro: "Welcome to your personalized dashboard! Let's take a quick tour."
                },
                {
                    element: document.querySelector('#fileNameDisplay'),
                    intro: "You can rename your file by clicking here."
                },
                {
                    element: document.querySelector('#addTaskBtn'),
                    intro: "Click here to add a new task."
                },
                {
                    element: document.querySelector('#filterTasksBtn'),
                    intro: "Filter your task to download"
                },
                {
                    element: document.querySelector('#undoBtn'),
                    intro: "Undo from here"
                },
                {
                    element: document.querySelector('#toDo'),
                    intro: "This is the 'To Do' section where you can see tasks that need to be started."
                },
                {
                    element: document.querySelector('#inProgress'),
                    intro: "Move tasks here when you start working on them. (Drag & Drop to move the task)"
                },
                {
                    element: document.querySelector('#complete'),
                    intro: "Move tasks here when they are completed."
                },
                {
                    element: document.querySelector('.task-card'),
                    intro: "Click on a task to view details, edit or delete it."
                },
                {
                    element: document.querySelector('#exportBtn'),
                    intro: "You can export your tasks to an Excel file."
                },
                {
                    element: document.querySelector('#shareBtn'),
                    intro: "Share your tasks via email."
                },
                {
                    intro: "That's the end of the tour! You are ready to start using the dashboard."
                }
            ]
        }).start();
    };

    // Skip the tour
    skipTourBtn.onclick = function () {
        tourModal.style.display = 'none';
    };

    // Show rename modal on filename click
    fileNameDisplay.onclick = function () {
        renameModal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    // Close rename modal
    closeRenameModal.onclick = function () {
        renameModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Handle rename form submission
    renameForm.onsubmit = function (event) {
        event.preventDefault();
        fileName = fileNameInput.value;
        fileNameDisplay.textContent = fileName;
        renameModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Export tasks
    exportBtn.onclick = function () {
        const tasks = getVisibleTasks();
        const formattedTasks = tasks.map((task, index) => ({
            Sr_No: index + 1,
            Task_Name: task.name,
            Description: task.description,
            Status: task.column === 'complete' ? 'Completed' : 'Pending',
            Date: task.date,
            Time: task.time // Include time in the exported data
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(formattedTasks);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    function getVisibleTasks() {
        const tasks = getTasks();
        return tasks.filter(task => {
            const taskCard = document.getElementById(`task-${task.id}`);
            return taskCard && taskCard.style.display !== 'none';
        });
    }

    // Handle share button click
    shareBtn.onclick = function () {
        const subject = encodeURIComponent('My Task List');
        const body = encodeURIComponent('Please find my task list attached. You can download the attachment from the dashboard.');
        const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;

        window.open(gmailLink, '_blank');
    };

    // Search tasks
    searchTasks.oninput = function () {
        const query = searchTasks.value.toLowerCase();
        filterTasks(query);
    }

    // Show filter modal on button click
    filterTasksBtn.onclick = function () {
        filterModal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }

    // Close filter modal
    closeFilterModal.onclick = function () {
        filterModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    // Initialize datepickers
    $("#startDate").datepicker({
        dateFormat: "yy-mm-dd"
    });
    $("#endDate").datepicker({
        dateFormat: "yy-mm-dd"
    });

    // Filter tasks by date range
    filterForm.onsubmit = function (event) {
        event.preventDefault();
        const startDate = $("#startDate").datepicker("getDate");
        const endDate = $("#endDate").datepicker("getDate");
        
        // Normalize dates to start at midnight for comparison
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999); // End of the day

        filterTasksByDateRange(startDate, endDate);
        filterModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    function filterTasksByDateRange(startDate, endDate) {
        const tasks = getTasks();
        tasks.forEach(task => {
            const taskDate = new Date(task.date);
            const taskCard = document.getElementById(`task-${task.id}`);
            
            // Reset the display style to none for all tasks
            taskCard.style.display = 'none';

            if (startDate && endDate) {
                if (taskDate >= startDate && taskDate <= endDate) {
                    taskCard.style.display = '';
                }
            } else {
                taskCard.style.display = '';
            }
        });
    }

    // Clear filter
    clearFilterModalBtn.onclick = function () {
        $("#startDate").datepicker("setDate", null);
        $("#endDate").datepicker("setDate", null);
        filterTasksByDateRange(null, null);
        filterModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    function filterTasks(query) {
        const tasks = getTasks();
        tasks.forEach(task => {
            const taskCard = document.getElementById(`task-${task.id}`);
            if (task.name.toLowerCase().includes(query) || (task.tags && task.tags.toLowerCase().includes(query))) {
                taskCard.style.display = '';
            } else {
                taskCard.style.display = 'none';
            }
        });
    }

    // Load tasks from localStorage
    loadTasks();
    updateTaskCounts();

    addTaskBtn.onclick = function () {
        // Reset form fields
        taskForm.reset();
        // Set default status to "To Do"
        document.getElementById('todo').checked = true;
        // Show the modal
        taskModal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    closeModal.onclick = function () {
        taskModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    closeDetailsModal.onclick = function () {
        taskDetailsModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    window.onclick = function (event) {
        if (event.target == taskModal) {
            taskModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        if (event.target == taskDetailsModal) {
            taskDetailsModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        if (event.target == tourModal) {
            tourModal.style.display = 'none';
        }
        if (event.target == renameModal) {
            renameModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        if (event.target == filterModal) {
            filterModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    taskForm.onsubmit = function (event) {
        event.preventDefault();
        const taskImage = taskForm.taskImage.files[0];
        const reader = new FileReader();
        reader.onloadend = function () {
            const task = {
                id: Date.now(),
                name: taskForm.taskName.value,
                date: taskForm.taskDate.value,
                time: taskForm.taskTime.value, // Include time in the task object
                description: taskForm.taskDescription.value,
                column: taskForm.taskStatus.value,
                important: false, // Default important value
                image: reader.result // Store the image data as a base64 string
            };
            addTaskToDOM(task);
            saveTask(task);
            taskModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            taskForm.reset();
            updateTaskCounts();
        }
        if (taskImage) {
            reader.readAsDataURL(taskImage);
        } else {
            const task = {
                id: Date.now(),
                name: taskForm.taskName.value,
                date: taskForm.taskDate.value,
                time: taskForm.taskTime.value, 
                description: taskForm.taskDescription.value,
                column: taskForm.taskStatus.value,
                important: false, 
                image: null 
            };
            addTaskToDOM(task);
            saveTask(task);
            taskModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            taskForm.reset();
            updateTaskCounts();
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }
    
    function addTaskToDOM(task) {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.setAttribute('draggable', 'true');
        taskCard.id = `task-${task.id}`;
        taskCard.innerHTML = `
            <h5>${task.name}</h5>
            <div style="display:flex; justify-content:space-between;align-items:start; font-size:14px;">
                <p>${formatDate(task.date)}</p>
                <p>${task.time}</p>
            </div>
            <i class="fa-solid fa-star important" data-id="${task.id}" style="cursor:pointer;" title="Mark as Important"></i>
            <i class="fa-regular fa-clone copy-task" data-id="${task.id}" style="cursor:pointer;" title="Copy Task"></i> 
            <i class="fa-solid fa-trash delete-task" data-id="${task.id}" style="cursor:pointer;" title="Delete Task"></i> 
        `;
        if (task.important) {
            taskCard.querySelector('.important').classList.add('important-true');
        }
        taskCard.querySelector('.important').onclick = function () {
            toggleImportant(task);
        };
        taskCard.querySelector('.copy-task').onclick = function (e) {
            e.stopPropagation(); // Prevent triggering the edit modal
            duplicateTask(task);
        };
        taskCard.querySelector('.delete-task').onclick = function (e) {
            e.stopPropagation(); // Prevent triggering the edit modal
            showDeleteConfirmationModal(task.id);
        };
        taskCard.ondragstart = function (e) {
            e.dataTransfer.setData('text', JSON.stringify(task));
            currentTask = task;
        };
        taskCard.onclick = function (e) {
            if (!e.target.classList.contains('copy-task') && !e.target.classList.contains('delete-task')) {
                showTaskDetails(task);
            }
        };
        taskColumns[task.column].appendChild(taskCard);
    }

    function toggleImportant(task) {
        task.important = !task.important;
        updateTask(task);
    }

    function showTaskDetails(task) {
        taskDetailsContent.innerHTML = `
            <h5>${task.name}</h5>
            <p>${task.date} ${task.time}</p>
            <p>${task.description}</p>
            ${task.image ? `<img src="${task.image}" alt="${task.name}" style="max-width: 100%;">` : ''}
            <i class="fa-regular fa-star important" data-id="${task.id}" style="cursor:pointer;"></i>
        `;
        if (task.important) {
            taskDetailsContent.querySelector('.important').classList.add('important-true');
        }
        taskDetailsContent.querySelector('.important').onclick = function () {
            toggleImportant(task);
        };
        taskDetailsModal.style.display = 'block';
        document.body.classList.add('modal-open');
        document.getElementById('editTaskBtn').onclick = function () {
            editTask(task);
        };
        document.getElementById('deleteTaskBtn').onclick = function () {
            deleteTask(task);
        };
    }

    function editTask(task) {
        document.getElementById("taskDetailsModal").style.display = "none";
        taskModal.style.display = 'block';
        document.body.classList.add('modal-open');
        taskForm.taskName.value = task.name;
        taskForm.taskDate.value = task.date;
        taskForm.taskTime.value = task.time; // Populate time field when editing
        taskForm.taskDescription.value = task.description;
        taskForm.taskStatus.value = task.column;
        taskForm.onsubmit = function (event) {
            event.preventDefault();
            task.name = taskForm.taskName.value;
            task.date = taskForm.taskDate.value;
            task.time = taskForm.taskTime.value; // Include time in the updated task
            task.description = taskForm.taskDescription.value;
            task.column = taskForm.taskStatus.value;
            const taskImage = taskForm.taskImage.files[0];
            if (taskImage) {
                const reader = new FileReader();
                reader.onloadend = function () {
                    task.image = reader.result;
                    updateTask(task);
                    taskModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    taskForm.reset();
                    updateTaskCounts();
                }
                reader.readAsDataURL(taskImage);
            } else {
                updateTask(task);
                taskModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                taskForm.reset();
                updateTaskCounts();
            }
        }
    }

    function deleteTask(task) {
        if (confirm('Are you sure you want to delete this task?')) {
            const tasks = getTasks();
            const updatedTasks = tasks.filter(t => t.id !== task.id);
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
            loadTasks();
            taskDetailsModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            updateTaskCounts();
        }
    }

    // delete task by id
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-task')) {
            const taskId = event.target.getAttribute('data-id');
            showDeleteConfirmationModal(taskId);
        }
    });
    
    function showDeleteConfirmationModal(taskId) {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        deleteModal.style.display = 'block';
        document.body.classList.add('modal-open');
    
        confirmDeleteBtn.onclick = function () {
            deleteTaskById(taskId);
            deleteModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    
        document.getElementById('cancelDeleteBtn').onclick = function () {
            deleteModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    
        document.getElementsByClassName('close-delete-modal')[0].onclick = function () {
            deleteModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };
    
        window.onclick = function (event) {
            if (event.target == deleteModal) {
                deleteModal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        };
    }
    
    function deleteTaskById(taskId) {
        const tasks = getTasks();
        const updatedTasks = tasks.filter(task => task.id != taskId);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        loadTasks();
        updateTaskCounts();
    }

    function saveHistory() {
        const tasks = getTasks();
        if (historyPosition < taskHistory.length - 1) {
            taskHistory = taskHistory.slice(0, historyPosition + 1);
        }
        taskHistory.push(JSON.stringify(tasks));
        if (taskHistory.length > maxHistory) {
            taskHistory.shift();
        } else {
            historyPosition++;
        }
    }

    function updateTask(task) {
        const tasks = getTasks();
        const updatedTasks = tasks.map(t => t.id === task.id ? task : t);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        saveHistory(); // Save history after making changes
        loadTasks();
        updateTaskCounts();
    }

    function saveTask(task) {
        const tasks = getTasks();
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        saveHistory(); // Save history after making changes
        updateTaskCounts();
    }

    function deleteTaskById(taskId) {
        const tasks = getTasks();
        const updatedTasks = tasks.filter(task => task.id != taskId);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        saveHistory(); // Save history after making changes
        loadTasks();
        updateTaskCounts();
    }

    function duplicateTask(task) {
        const newTask = {
            ...task,
            id: Date.now() // Assign a new ID
        };
        addTaskToDOM(newTask);
        saveTask(newTask);
        saveHistory(); // Save history after making changes
        updateTaskCounts();
    }

    undoBtn.onclick = function () {
        if (historyPosition > 0) {
            historyPosition--;
            const previousTasks = JSON.parse(taskHistory[historyPosition]);
            localStorage.setItem('tasks', JSON.stringify(previousTasks));
            loadTasks();
            updateTaskCounts();
        }
    };

    function getTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks'));
        return Array.isArray(tasks) ? tasks : [];
    }

    function loadTasks() {
        const tasks = getTasks();
        Object.keys(taskColumns).forEach(column => {
            taskColumns[column].innerHTML = '';
        });
        tasks.forEach(task => addTaskToDOM(task));
        updateTaskCounts();
    }

    // Save the initial state to history
    saveHistory();

    // ----------- copy button script ---------------

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('copy-task')) {
            const taskId = event.target.getAttribute('data-id');
            const task = getTaskById(taskId);
            duplicateTask(task);
        }
    });

    function getTaskById(taskId) {
        const tasks = getTasks();
        return tasks.find(task => task.id == taskId);
    }

    function duplicateTask(task) {
        const newTask = {
            ...task,
            id: Date.now() // Assign a new ID
        };
        addTaskToDOM(newTask);
        saveTask(newTask);
        updateTaskCounts();
    }    
    
    // ---------------------------

    document.querySelectorAll('.task-column').forEach(column => {
        column.ondragover = function (e) {
            e.preventDefault();
        }
        column.ondrop = function (e) {
            e.preventDefault();
            const task = JSON.parse(e.dataTransfer.getData('text'));
            task.column = e.currentTarget.id;
            updateTask(task);
            updateTaskCounts();
        }
    });

    // Theme toggle
    const checkbox = document.querySelector('.chk'); // Updated to match the class used in HTML
    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });

    // Reminder notifications
    function checkTaskReminders() {
        const tasks = getTasks();
        tasks.forEach(task => {
            const taskDate = new Date(task.date);
            const today = new Date();
            if (taskDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
                notifyUser(`Reminder: Task "${task.name}" is due today!`);
            }
        });
    }

    function notifyUser(message) {
        if (Notification.permission === 'granted') {
            new Notification(message);
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(message);
                }
            });
        }
    }

    checkTaskReminders();
    setInterval(checkTaskReminders, 86400000); // Check reminders daily

});
