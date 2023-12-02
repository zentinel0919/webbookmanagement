

// form repeater
$(document).ready(function(){
    $('.repeater').repeater({
        initEmpty: false,
        defaultValues: {
            'text-input': ''
        },
        show:function(){
            $(this).slideDown();
        },
        hide: function(deleteElement){
            $(this).slideUp(deleteElement);
            setTimeout(() => {
                generateCV();
            }, 500);
        },
        isFirstItemUndeletable: true
    })
})

document.addEventListener("DOMContentLoaded", function () {
    // Get the current URL path
    const currentPath = window.location.pathname;
  
    // Get all navigation links
    const navLinks = document.querySelectorAll(".navtext");
    const coverLetterInputs = document.querySelectorAll('#coverLetterForm input, #coverLetterForm textarea');
  
    coverLetterInputs.forEach(input => {
        input.addEventListener('input', generateCoverLetter);
    });

    navLinks.forEach(function (link) {
      // Check if the link's href matches the current path
      if (link.getAttribute("href") === currentPath) {
        // Add the 'active-link' class to the active link
        link.classList.add("active-link");
      }
    });
  });
  
  function showContent(event, sectionId) {
    event.preventDefault(); // Prevent the default anchor click behavior

    // Debugging line to ensure the function is called
    console.log('Toggling active class for:', sectionId);

    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });

    // Remove active class from all links
    const links = document.querySelectorAll('.pagination-links a');
    links.forEach(link => {
        link.classList.remove('active');
    });

    // Show the clicked section and add active class to the clicked link
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById(sectionId).classList.add('active');
    document.getElementById(sectionId + '-link').classList.add('active');
}

// Usage example: Update your onclick in HTML to pass the event object
// <a href="#" id="resume-link" onclick="showContent(event, 'resume')">Resume</a>


function coverLetterTemplate(name, phone, email, address, recipientName, companyAddress, position, message) {
    return `
${name.toUpperCase()}<br>
${position}<br>
${phone}<br>
${email}<br>
${address}<br><br>

${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}<br><br>

${recipientName}<br>
Hiring Manager, Really Great Place<br>
${phone}<br>
${email}<br>
${companyAddress}<br><br>

JOB REFERENCE: SENIOR ACCOUNT MANAGER<br><br>

Dear ${recipientName.split(" ")[0]},<br><br>

${message}<br><br>

Sincerely,<br><br>

${name}
    `;
}

function generateCoverLetter() {

    const coverLetter = coverLetterTemplate(
        document.getElementById('name').value,
        document.getElementById('phone').value,
        document.getElementById('email').value,
        document.getElementById('address').value,
        document.getElementById('recipientName').value,
        document.getElementById('companyAddress').value,
        document.getElementById('position').value,
        document.getElementById('message').value
    );


    document.getElementById('output').innerHTML = coverLetter;
}

function printCL() {
    const printableContent = document.getElementById('output').innerHTML;
    const win = window.open('', 'Print', 'width=1500,height=800');
    win.document.write('<html><head><title>Print</title></head><body onload="window.print()">' + printableContent + '</body></html>');
    win.document.close();
}
