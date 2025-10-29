// Simple calendar app - no frameworks, just plain JavaScript

// Store events in browser memory
let events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
let currentDate = new Date();
let currentView = 'month';
let selectedColor = '#3b82f6';
let editingEventId = null;

// Sample events for testing
if (events.length === 0) {
    events = [
        {
            id: '1',
            title: 'Team Meeting',
            description: 'Weekly team sync',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            color: '#3b82f6'
        }
    ];
    saveEvents();
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    renderCalendar();
    updateMonthHeader();
});

// Save events to localStorage
function saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

// Render the calendar based on current view
function renderCalendar() {
    if (currentView === 'month') {
        renderMonthView();
        document.getElementById('month-view').style.display = 'block';
        document.getElementById('week-view').style.display = 'none';
    } else {
        renderWeekView();
        document.getElementById('month-view').style.display = 'none';
        document.getElementById('week-view').style.display = 'block';
    }
}

// Render month view
function renderMonthView() {
    const daysGrid = document.getElementById('calendar-days');
    daysGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        const dayDate = new Date(year, month - 1, prevMonthLastDay - i);
        daysGrid.appendChild(createDayElement(dayDate, true));
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(year, month, i);
        const isToday = dayDate.toDateString() === today.toDateString();
        daysGrid.appendChild(createDayElement(dayDate, false, isToday));
    }
    
    // Next month days to complete grid
    const totalCells = 42; // 6 weeks
    const remaining = totalCells - (startingDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        const dayDate = new Date(year, month + 1, i);
        daysGrid.appendChild(createDayElement(dayDate, true));
    }
}

// Create a day element for month view
function createDayElement(date, isOtherMonth, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    if (isOtherMonth) dayElement.classList.add('other-month');
    if (isToday) dayElement.classList.add('today');
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    
    if (isToday) {
        dayNumber.innerHTML = `<span class="today-badge">${date.getDate()}</span>`;
    } else {
        dayNumber.textContent = date.getDate();
    }
    
    dayElement.appendChild(dayNumber);
    
    // Add events for this day
    const dayEvents = getEventsForDay(date);
    const eventsList = document.createElement('div');
    eventsList.className = 'events-list';
    
    // Show max 2 events
    dayEvents.slice(0, 2).forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.textContent = event.title;
        eventElement.style.backgroundColor = event.color;
        eventElement.onclick = (e) => {
            e.stopPropagation();
            editEvent(event);
        };
        eventsList.appendChild(eventElement);
    });
    
    // Show "more" indicator if there are more events
    if (dayEvents.length > 2) {
        const moreElement = document.createElement('div');
        moreElement.className = 'more-events';
        moreElement.textContent = `+${dayEvents.length - 2} more`;
        moreElement.onclick = (e) => {
            e.stopPropagation();
            // In a real app, you might show a detailed view
            alert(`Events on ${date.toDateString()}:\n` + 
                  dayEvents.map(e => e.title).join('\n'));
        };
        eventsList.appendChild(moreElement);
    }
    
    dayElement.appendChild(eventsList);
    dayElement.onclick = () => openCreateModal(date);
    
    return dayElement;
}

// Get events for a specific day
function getEventsForDay(date) {
    return events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === date.toDateString();
    });
}

// Render week view (simplified)
function renderWeekView() {
    // This is a simplified version - you can expand it later
    const weekDaysHeader = document.querySelector('.week-days-header');
    weekDaysHeader.innerHTML = '';
    
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'week-day-header';
        dayElement.textContent = day.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        weekDaysHeader.appendChild(dayElement);
    }
}

// Navigation functions
function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonthHeader();
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonthHeader();
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    updateMonthHeader();
    renderCalendar();
}

function setView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-toggle .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderCalendar();
}

function updateMonthHeader() {
    const monthYear = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('current-month').textContent = monthYear;
}

// Modal functions
function openCreateModal(date) {
    editingEventId = null;
    document.getElementById('modal-title').textContent = 'Create Event';
    document.getElementById('event-form').reset();
    
    // Set default dates
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    
    document.getElementById('event-start').value = formatDateTimeLocal(start);
    document.getElementById('event-end').value = formatDateTimeLocal(end);
    
    // Reset color
    selectedColor = '#3b82f6';
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector('.color-option').classList.add('active');
    
    document.getElementById('event-modal').style.display = 'block';
}

function editEvent(event) {
    editingEventId = event.id;
    document.getElementById('modal-title').textContent = 'Edit Event';
    
    // Fill form with event data
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-desc').value = event.description || '';
    document.getElementById('event-start').value = formatDateTimeLocal(new Date(event.startDate));
    document.getElementById('event-end').value = formatDateTimeLocal(new Date(event.endDate));
    
    // Set color
    selectedColor = event.color;
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.style.backgroundColor === event.color) {
            opt.classList.add('active');
        }
    });
    
    document.getElementById('event-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('event-modal').style.display = 'none';
    editingEventId = null;
}

function selectColor(color, element) {
    selectedColor = color;
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
    });
    element.classList.add('active');
}

function saveEvent(event) {
    event.preventDefault();
    
    const title = document.getElementById('event-title').value.trim();
    const description = document.getElementById('event-desc').value.trim();
    const startDate = new Date(document.getElementById('event-start').value);
    const endDate = new Date(document.getElementById('event-end').value);
    
    // Basic validation
    if (!title) {
        alert('Please enter a title');
        return;
    }
    
    if (endDate <= startDate) {
        alert('End date must be after start date');
        return;
    }
    
    const eventData = {
        title,
        description,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        color: selectedColor
    };
    
    if (editingEventId) {
        // Update existing event
        const eventIndex = events.findIndex(e => e.id === editingEventId);
        if (eventIndex !== -1) {
            events[eventIndex] = { ...events[eventIndex], ...eventData };
        }
    } else {
        // Create new event
        eventData.id = Date.now().toString();
        events.push(eventData);
    }
    
    saveEvents();
    closeModal();
    renderCalendar();
    
    alert('Event saved successfully!');
}

// Helper function to format date for datetime-local input
function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('event-modal');
    if (event.target === modal) {
        closeModal();
    }
}