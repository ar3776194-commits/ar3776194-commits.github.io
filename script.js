document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM elements
    const form = document.getElementById('resumeForm');
    const resumeOutput = document.getElementById('resume-output');
    const downloadBtn = document.getElementById('downloadBtn');
    const addWorkExpBtn = document.getElementById('addWorkExpBtn');
    const addEducationBtn = document.getElementById('addEducationBtn');
    
    // Initialize counters based on existing elements (should be 1 initially)
    // We only use these to generate UNIQUE data-id and input names for new fields
    let workExpCount = document.querySelectorAll('#work-experience-section .experience-entry').length || 1;
    let educationCount = document.querySelectorAll('#education-section .education-entry').length || 1;
    
    // Ensure the initial static entry has the data-id attribute for lookups
    document.querySelector('#work-experience-section .experience-entry:not([data-id])')?.setAttribute('data-id', 1);
    document.querySelector('#education-section .education-entry:not([data-id])')?.setAttribute('data-id', 1);


    // --- 1. Functions to Dynamically Add Fields ---

    const createWorkExperienceField = (count) => {
        return `
            <div class="experience-entry" data-id="${count}">
                <hr>
                <h3>Job #${count}</h3>
                <label for="jobTitle${count}">Job Title:</label>
                <input type="text" id="jobTitle${count}" name="jobTitle${count}">

                <label for="company${count}">Company:</label>
                <input type="text" id="company${count}" name="company${count}">

                <label for="duration${count}">Duration (e.g., Jan 2020 - Present):</label>
                <input type="text" id="duration${count}" name="duration${count}">

                <label for="responsibilities${count}">Key Responsibilities/Achievements (Use bullet points):</label>
                <textarea id="responsibilities${count}" name="responsibilities${count}" rows="3"></textarea>
                <button type="button" class="remove-field-btn" data-type="work" data-id="${count}">Remove Job</button>
            </div>
        `;
    };

    const createEducationField = (count) => {
        return `
            <div class="education-entry" data-id="${count}">
                <hr>
                <h3>School #${count}</h3>
                <label for="degree${count}">Degree/Certification:</label>
                <input type="text" id="degree${count}" name="degree${count}">

                <label for="institution${count}">Institution Name:</label>
                <input type="text" id="institution${count}" name="institution${count}">

                <label for="eduYear${count}">Graduation Year:</label>
                <input type="text" id="eduYear${count}" name="eduYear${count}">
                <button type="button" class="remove-field-btn" data-type="edu" data-id="${count}">Remove School</button>
            </div>
        `;
    };

    const addField = (type, containerId, createFunc, currentCount) => {
        const newCount = currentCount + 1;
        const container = document.getElementById(containerId);
        
        // Use the specific 'Add Another' button to determine where to insert the new field
        const button = (type === 'work') ? addWorkExpBtn : addEducationBtn;
        
        const newFieldContainer = document.createElement('div');
        newFieldContainer.innerHTML = createFunc(newCount);
        
        // Insert the new field before the 'Add Another' button
        container.insertBefore(newFieldContainer.firstChild, button);
        
        return newCount;
    };

    addWorkExpBtn.addEventListener('click', () => {
        workExpCount = addField('work', 'work-experience-section', createWorkExperienceField, workExpCount);
    });

    addEducationBtn.addEventListener('click', () => {
        educationCount = addField('edu', 'education-section', createEducationField, educationCount);
    });

    // Handle removal of dynamically added fields using event delegation
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-field-btn')) {
            // Find the closest parent div that represents the entire entry
            const entry = e.target.closest('.experience-entry') || e.target.closest('.education-entry');
            if (entry) {
                entry.remove();
                // Counter is NOT decremented, but the submit function is now FIXED to handle this.
            }
        }
    });

    // --- 2. Resume Generation/Preview Function (FIXED LOGIC) ---

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get all form data as an object for easy lookup
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        let resumeHTML = '';
        let hasContent = false; // Flag to check if any required data was entered

        // --- A. Personal Info Section ---
        const fullName = data.fullName.trim() || '';
        const summaryText = data.summary.trim() || '';
        const email = data.email.trim() || '';
        const phone = data.phone.trim() || '';
        const linkedin = data.linkedin.trim() || '';

        if (fullName || summaryText || email) {
            hasContent = true;
            resumeHTML += `
                <div class="resume-header">
                    <h2>${fullName.toUpperCase() || 'FULL NAME'}</h2>
                    <div class="contact-info">
                        ${email ? `<span>Email: ${email}</span>` : ''}
                        ${(email && phone) ? ' | ' : ''}
                        ${phone ? `<span>Phone: ${phone}</span>` : ''}
                        ${((email || phone) && linkedin) ? ' | ' : ''}
                        ${linkedin ? `<a href="${linkedin}" target="_blank">LinkedIn</a>` : ''}
                    </div>
                </div>
                <div class="section-divider"></div>
            `;
        }
        
        if (summaryText) {
             resumeHTML += `
                <div class="resume-section summary">
                    <h3>Professional Summary</h3>
                    <p>${summaryText}</p>
                </div>
            `;
        }


        // --- B. Work Experience Section (FIXED) ---
        const workExperiences = [];
        
        // Use document.querySelectorAll to find ONLY the entries that currently exist
        const workEntries = document.querySelectorAll('#work-experience-section .experience-entry');

        workEntries.forEach(entry => {
            const entryId = entry.getAttribute('data-id'); 
            
            // Look up values using the ID from the FormData
            const jobTitle = data[`jobTitle${entryId}`] ? data[`jobTitle${entryId}`].trim() : '';
            const company = data[`company${entryId}`] ? data[`company${entryId}`].trim() : '';

            if (jobTitle || company) {
                 workExperiences.push({
                    title: jobTitle,
                    company: company,
                    duration: data[`duration${entryId}`] ? data[`duration${entryId}`].trim() : '',
                    responsibilities: data[`responsibilities${entryId}`] ? data[`responsibilities${entryId}`].trim() : ''
                });
            }
        });

        if (workExperiences.length > 0) {
            hasContent = true;
            resumeHTML += `
                <div class="section-divider"></div>
                <div class="resume-section work-experience">
                    <h3>Work Experience</h3>
            `;
            workExperiences.forEach(job => {
                const bullets = job.responsibilities ? 
                    `<ul>${job.responsibilities.split('\n').filter(line => line.trim()).map(item => `<li>${item.trim()}</li>`).join('')}</ul>` : 
                    '';

                resumeHTML += `
                    <div class="job-entry">
                        <h4>${job.title || 'Job Title'} at ${job.company || 'Company'} <span class="duration">${job.duration || ''}</span></h4>
                        ${bullets}
                    </div>
                `;
            });
            resumeHTML += '</div>';
        }

        // --- C. Education Section (FIXED) ---
        const educationEntries = [];
        
        // Use document.querySelectorAll to find ONLY the entries that currently exist
        const eduEntries = document.querySelectorAll('#education-section .education-entry');

        eduEntries.forEach(entry => {
            const entryId = entry.getAttribute('data-id');
            
            // Look up values using the ID from the FormData
            const degree = data[`degree${entryId}`] ? data[`degree${entryId}`].trim() : '';
            const institution = data[`institution${entryId}`] ? data[`institution${entryId}`].trim() : '';

            if (degree || institution) {
                educationEntries.push({
                    degree: degree,
                    institution: institution,
                    year: data[`eduYear${entryId}`] ? data[`eduYear${entryId}`].trim() : ''
                });
            }
        });
        
        if (educationEntries.length > 0) {
            hasContent = true;
            resumeHTML += `
                <div class="section-divider"></div>
                <div class="resume-section education">
                    <h3>Education</h3>
            `;
            educationEntries.forEach(edu => {
                resumeHTML += `
                    <p><strong>${edu.degree || 'Degree'}</strong>, ${edu.institution || 'Institution'} (${edu.year || 'Year'})</p>
                `;
            });
            resumeHTML += '</div>';
        }

        // --- D. Skills Section ---
        if (data.skills && data.skills.trim()) {
            hasContent = true;
            const skillArray = data.skills.split(',').map(s => s.trim()).filter(s => s);
            resumeHTML += `
                <div class="section-divider"></div>
                <div class="resume-section skills">
                    <h3>Skills</h3>
                    <p class="skill-list">${skillArray.join(' &bull; ')}</p>
                </div>
            `;
        }
        
        // --- E. Finalizing Preview and Download Button ---
        if (hasContent) {
            resumeOutput.innerHTML = resumeHTML;
            downloadBtn.style.display = 'block';
        } else {
             // If the form was submitted but nothing useful was entered
            resumeOutput.innerHTML = '<p>Please enter your personal information and at least one section (Work, Education, or Skills) to generate a preview.</p>';
            downloadBtn.style.display = 'none';
        }

    });
    
    // --- 3. PDF Download Functionality ---

    downloadBtn.addEventListener('click', () => {
        const element = document.getElementById('resume-output');
        const fileName = document.getElementById('fullName').value.trim() || 'Resume';

        const opt = {
            margin:       0.5,
            filename:     `${fileName}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Check if html2pdf is loaded
        if (typeof html2pdf !== 'undefined') {
             html2pdf().set(opt).from(element).save();
        } else {
            alert('PDF generation library not loaded. Please ensure html2pdf.js is included in your HTML file!');
        }
    });

});
