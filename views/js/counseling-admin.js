// Add event listener for the "Confirm" button
const confirmButtons = document.querySelectorAll('.confirm-button');
confirmButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const meetingId = button.dataset.meetingId;
    // Send a request to update the meeting status to confirmed
    await fetch(`/confirm-meeting/${meetingId}`, {
      method: 'POST',
    });
    // Optionally, refresh the page or provide feedback to the admin
  });
});

// Add event listener for the "Mark as Done" button
const doneButtons = document.querySelectorAll('.done-button');
doneButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const meetingId = button.dataset.meetingId;
    // Send a request to update the meeting status to done
    await fetch(`/mark-as-done/${meetingId}`, {
      method: 'POST',
    });
    // Optionally, refresh the page or provide feedback to the admin
  });
});

const meetingDateInput = document.getElementById('meetingDate');
const addTimeBtn = document.getElementById('addTime');


document.addEventListener('DOMContentLoaded', function() {
    const pageButtons = document.querySelectorAll('.page-button');
    const meetingPages = document.querySelectorAll('.meeting-page');

    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pageToShow = this.getAttribute('data-page');

            // Remove active class from all pages and buttons
            meetingPages.forEach(page => {
                page.classList.remove('active');
            });
            pageButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            // Show the selected page and highlight the button
            document.getElementById(pageToShow).classList.add('active');
            this.classList.add('active');
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const calendar = document.getElementById('calendar');
    const today = new Date();
    let selectedDate = today;

    function renderCalendar() {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        const calendarTable = `
            <table class="calendar-table">
                <caption class="calendar-header">
                    <button id="prev-month">Previous</button>
                    <span id="current-month-year">${year}-${month + 1}</span>
                    <button id="next-month">Next</button>
                </caption>
                <tr>
                    <th>Sun</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                </tr>
                ${generateCalendarDays(year, month)}
            </table>
        `;

        calendar.innerHTML = calendarTable;

        // Add event listeners for prev and next buttons
        document.getElementById('prev-month').addEventListener('click', goToPrevMonth);
        document.getElementById('next-month').addEventListener('click', goToNextMonth);
        

        // Add click event listeners to days in the new calendar
        const days = document.querySelectorAll('.calendar-table td');
        days.forEach(day => {
            day.addEventListener('click', () => {
                // Remove the selected date class from all days
                days.forEach(d => d.classList.remove('selected-date'));
                // Add the selected date class to the clicked day
                day.classList.add('selected-date');
                // Update the selectedDate variable with the new date
                selectedDate = new Date(year, month, day.textContent);
                selectedDate.setMonth(selectedDate.getMonth());

                const selectedYear = selectedDate.getFullYear();
                const selectedMonth = selectedDate.getMonth();
                const selectedDay = day.textContent;
                const selectedDateObject = new Date(selectedYear, selectedMonth, parseInt(selectedDay) + 1);

                meetingDateInput.value = selectedDateObject.toISOString().split('T')[0];
                modal.style.display = 'block';
            });
        });
    }

    function generateCalendarDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let calendarDays = '';
        let currentDay;
    
        let startDay = firstDay.getDay();
        let endDay = lastDay.getDay();
    
        // Add padding at the start of the month if needed
        if (startDay !== 0) {
            calendarDays += '<tr>';
            for (let i = 0; i < startDay; i++) {
                calendarDays += `<td></td>`;
            }
        }
    
        currentDay = new Date(firstDay);
    
        while (currentDay <= lastDay) {
            if (currentDay.getDay() === 0) {
                calendarDays += '<tr>';
            }
    
            calendarDays += `<td>${currentDay.getDate()}</td>`;
    
            if (currentDay.getDay() === 6) {
                calendarDays += '</tr>';
            }
    
            currentDay.setDate(currentDay.getDate() + 1);
        }
    
        // Add padding at the end of the month if needed
        if (endDay !== 6) {
            for (let i = endDay + 1; i <= 6; i++) {
                calendarDays += `<td></td>`;
            }
            calendarDays += '</tr>';
        }
    
        return calendarDays;
    }
    
    
    

    function goToPrevMonth() {
        selectedDate.setMonth(selectedDate.getMonth() - 1);
        renderCalendar();
    }

    function goToNextMonth() {
        selectedDate.setMonth(selectedDate.getMonth() + 1);
        renderCalendar();
    }

    renderCalendar();
});

// ... (rest of your calendar code)

const modal = document.getElementById('timeModal');
const closeBtn = document.querySelector('.close');
const timeForm = document.getElementById('timeForm');
const timeInput = document.getElementById('timeInput');
const timeList = document.getElementById('timeList');
const startTimeInput = document.getElementById('startTimeInput');
const endTimeInput = document.getElementById('endTimeInput');
let selectedTimes = [];

// When a day is clicked, open the modal
document.querySelectorAll('.calendar-table td').forEach(day => {
    day.addEventListener('click', () => {
        console.log("Day clicked!");  // Add this line
        modal.style.display = 'block';
    });
});



closeBtn.onclick = function() {
    modal.style.display = 'none';
}


addTimeBtn.addEventListener('click', () => {
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const timeRange = `${startTime}-${endTime}`;

    if (startTime && endTime && !selectedTimes.includes(timeRange)) {
        selectedTimes.push(timeRange);
        
        const listItem = document.createElement('li');
        
        const removeBtn = document.createElement('span');
        removeBtn.textContent = 'X';
        removeBtn.className = 'remove-time-btn';
        removeBtn.style.marginRight = '10px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.addEventListener('click', function() {
            const index = selectedTimes.indexOf(timeRange);
            if (index > -1) {
                selectedTimes.splice(index, 1);
            }
            timeList.removeChild(listItem);
        });

        listItem.appendChild(removeBtn);
        listItem.appendChild(document.createTextNode(timeRange));
        timeList.appendChild(listItem);
    }
});



// Handle form submission
// Handle form submission
timeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if no time slots are selected
    if (selectedTimes.length === 0) {
        alert('Please select at least one time slot before saving.');
        return; // Exit the function
    }

    const date = meetingDateInput.value;

    // Send a POST request to save the available date and times
    const response = await fetch('/add-available-date', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: date,
            times: selectedTimes
        })
    });

    if (response.ok) {
        alert('Available times saved successfully!');
        modal.style.display = 'none';
        selectedTimes = [];
        timeList.innerHTML = '';
    } else {
        alert('Error saving available times. Please try again.');
    }
});


document.getElementById('filterBtn').addEventListener('click', function() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    rows.forEach(row => {
        const email = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const statusCell = row.querySelector('td:nth-child(5)');
        const status = statusCell.textContent.trim().toLowerCase();

        if ((email.includes(searchTerm)) && (statusFilter === 'all' || status === statusFilter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

