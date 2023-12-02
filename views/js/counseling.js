document.addEventListener('DOMContentLoaded', function () {
    const calendar = document.getElementById('calendar');
    const meetingDateInput = document.getElementById('meetingDate');
    const modal = document.getElementById('timeSlotModal');
    const closeBtn = document.querySelector('.close');
    const timeSlotDropdown = document.getElementById('availableTimeSlots');
    const scheduleMeetingButton = document.getElementById('scheduleMeetingButton');
    const meetingPurposeInput = document.getElementById('meetingPurposeInput');
    const today = new Date();
    let selectedDate = today;

    async function renderCalendar() {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();

        const response = await fetch('/get-available-dates');
        const data = await response.json();
        const availableDatesFull = data.map(item => new Date(item.date).toISOString().split('T')[0]);

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
                ${generateCalendarDays(year, month, availableDatesFull)}
            </table>
        `;

        calendar.innerHTML = calendarTable;

        document.getElementById('prev-month').addEventListener('click', goToPrevMonth);
        document.getElementById('next-month').addEventListener('click', goToNextMonth);

        const days = document.querySelectorAll('.calendar-table td');
        days.forEach(day => {
            day.addEventListener('click', async () => {
                if (day.classList.contains('available-date')) {
                days.forEach(d => d.classList.remove('selected-date'));
                const clickedDateStr = day.getAttribute('data-full-date');
                if (clickedDateStr === meetingDateInput.value) {
                    day.classList.add('selected-date');
                }
                selectedDate = new Date(Date.UTC(clickedDateStr.split('-')[0], clickedDateStr.split('-')[1] - 1, clickedDateStr.split('-')[2]));
                meetingDateInput.value = clickedDateStr;

                // Fetch available times for the selected date
                const timesResponse = await fetch(`/get-times-for-date?date=${meetingDateInput.value}`);
                modal.style.display = "block";
                if(timesResponse.ok) {
                    const timesData = await timesResponse.json();
                    console.log("Times Data:", timesData);
                    const times = timesData.times || [];
                    const timeSlotDropdown = document.getElementById('availableTimeSlots');

                    // Clear previous options
                    timeSlotDropdown.innerHTML = '';
                    
                    for (let i = 0; i < timesData.length; i++) {
                        const option = document.createElement('option');
                        option.value = timesData[i];
                        option.textContent = convertTo12HourFormat(timesData[i]);
                        timeSlotDropdown.appendChild(option);
                    }
                    
                    
                    function convertTo12HourFormat(time) {
                        const [start, end] = time.split('-');
                        return `${convertTime(start.trim())} - ${convertTime(end.trim())}`;
                    }
                    
                    
                    function convertTime(time) {
                        let [hour, minute] = time.split(':').map(Number);
                        const period = hour >= 12 ? 'PM' : 'AM';
                    
                        if (hour > 12) hour -= 12;
                        if (hour === 0) hour = 12;
                        minute = minute.toString().padStart(2, '0');
                        
                        return `${hour}:${minute} ${period}`;
                    }
                    

                } else {
                    console.error("Failed to fetch times for the selected date.");
                }
            }
            });
        });
    }

    function generateCalendarDays(year, month, availableDatesFull) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(1 - firstDay.getDay());
        const endDate = new Date(lastDay);
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
        

        let calendarDays = '<tr>';

        while (startDate <= endDate) {
            const currentDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
            if (availableDatesFull.includes(currentDateStr)) {
                calendarDays += `<td class="available-date" data-full-date="${currentDateStr}">${startDate.getDate()}</td>`;
            } else {
                calendarDays += `<td data-full-date="${currentDateStr}">${startDate.getDate()}</td>`;
            }

            if (startDate.getDay() === 6) {
                calendarDays += '</tr>';
                if (startDate < endDate) {
                    calendarDays += '<tr>';
                }
            }
            startDate.setDate(startDate.getDate() + 1);
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

    closeBtn.onclick = function(event) {
        modal.style.display = "none";
        event.stopPropagation();  // Prevent triggering of window.onclick
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    


    renderCalendar();

    const confirmButtons = document.querySelectorAll('.confirm-button');
    confirmButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const meetingId = button.dataset.meetingId;
            await fetch(`/confirm-meeting/${meetingId}`, {
                method: 'POST',
            });
        });
    });

    const doneButtons = document.querySelectorAll('.done-button');
    doneButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const meetingId = button.dataset.meetingId;
            await fetch(`/mark-as-done/${meetingId}`, {
                method: 'POST',
            });
        });
    });

    const pageButtons = document.querySelectorAll('.page-button');
    const meetingPages = document.querySelectorAll('.meeting-page');

    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pageToShow = this.getAttribute('data-page');
            meetingPages.forEach(page => {
                page.classList.remove('active');
            });
            pageButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(pageToShow).classList.add('active');
            this.classList.add('active');
        });
    });
});


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

