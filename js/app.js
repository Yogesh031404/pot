// Eco-Pots Application JavaScript

// Global variables
let selectedMaterial = null;
let formData = {};
let autoSaveTimer = null;

// Material types mapping
const materialTypes = {
    'plastic-bottles': 'Plastic Bottles',
    'ropes-strings': 'Ropes & Strings',
    'old-shoes': 'Old Shoes',
    'glass-jars': 'Glass Jars',
    'metal-cans': 'Metal Cans',
    'other-materials': 'Other Materials'
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load saved data from localStorage
    loadSavedData();

    // Initialize page-specific functionality
    if (document.querySelector('.materials-grid')) {
        initializeMaterialsPage();
    }

    if (document.querySelector('#registrationForm')) {
        initializeRegistrationPage();
    }

    if (document.querySelector('.registration-summary')) {
        initializeThanksPage();
    }

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Materials Page Functions
function initializeMaterialsPage() {
    // Restore previously selected material if exists
    const savedMaterial = localStorage.getItem('selectedMaterial');
    if (savedMaterial) {
        selectMaterial(savedMaterial);
    }
}

function selectMaterial(materialId) {
    // Remove previous selection
    document.querySelectorAll('.material-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Add selection to clicked card
    const selectedCard = document.querySelector(`[data-material="${materialId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedMaterial = materialId;

        // Update display
        updateSelectedDisplay();

        // Save to localStorage
        localStorage.setItem('selectedMaterial', materialId);

        // Enable next button
        const nextButton = document.getElementById('nextButton');
        if (nextButton) {
            nextButton.disabled = false;
        }
    }
}

function updateSelectedDisplay() {
    const display = document.getElementById('selectedDisplay');
    if (display && selectedMaterial) {
        display.innerHTML = `
            <strong>Selected Material:</strong> ${materialTypes[selectedMaterial]}
        `;
    }
}

function proceedToRegistration() {
    if (selectedMaterial) {
        // Save selection and navigate to registration
        localStorage.setItem('selectedMaterial', selectedMaterial);
        window.location.href = 'register.html';
    }
}

// Registration Page Functions
function initializeRegistrationPage() {
    // Load selected material from materials page
    const materialInput = document.getElementById('selectedMaterial');
    if (materialInput) {
        const savedMaterial = localStorage.getItem('selectedMaterial');
        if (savedMaterial) {
            // Try to find matching option in the dropdown
            const materialValue = materialTypes[savedMaterial] || savedMaterial;
            const options = materialInput.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === materialValue) {
                    materialInput.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // Load saved form data
    loadFormData();

    // Set up auto-save
    setupAutoSave();

    // Add input event listeners for real-time validation
    const form = document.getElementById('registrationForm');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                validateFieldApp(this); // Use app.js validation function
                saveFormData();
            });

            input.addEventListener('blur', function() {
                validateFieldApp(this);
            });
        });

        // Character counter for craft description
        const craftDescription = document.getElementById('craftDescription');
        if (craftDescription) {
            craftDescription.addEventListener('input', updateCharacterCount);
        }

        // Initialize submit button state
        updateSubmitButton();
    }
}

function loadFormData() {
    const savedData = localStorage.getItem('registrationFormData');
    if (savedData) {
        try {
            formData = JSON.parse(savedData);
            // Populate form fields
            Object.keys(formData).forEach(key => {
                const field = document.querySelector(`[name="${key}"]`);
                if (field) {
                    field.value = formData[key];
                }
            });

            // Update character count if craft description exists
            const craftDescription = document.getElementById('craftDescription');
            if (craftDescription && formData.craftDescription) {
                updateCharacterCount.call(craftDescription);
            }
        } catch (e) {
            console.error('Error loading saved form data:', e);
        }
    }
}

function saveFormData() {
    const form = document.getElementById('registrationForm');
    if (form) {
        const formDataObj = new FormData(form);
        formData = {};

        for (let [key, value] of formDataObj.entries()) {
            formData[key] = value;
        }

        localStorage.setItem('registrationFormData', JSON.stringify(formData));
    }
}

function setupAutoSave() {
    // Clear existing timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }

    // Set new timer
    autoSaveTimer = setTimeout(() => {
        saveFormData();
        showAutoSaveIndicator();
    }, 30000); // Auto-save every 30 seconds
}

function showAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator');
    const status = document.getElementById('saveStatus');

    if (indicator && status) {
        status.textContent = 'Draft saved';
        indicator.style.display = 'flex';

        // Hide after 3 seconds
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }
}

function updateCharacterCount() {
    const charCount = document.getElementById('charCount');
    const maxLength = 500;

    if (charCount) {
        const currentLength = this.value.length;
        charCount.textContent = currentLength;

        // Change color based on length
        if (currentLength > maxLength * 0.9) {
            charCount.style.color = 'var(--error)';
        } else if (currentLength > maxLength * 0.7) {
            charCount.style.color = 'var(--warning)';
        } else {
            charCount.style.color = 'var(--dark-gray)';
        }
    }
}

// Form submission
async function handleSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = document.getElementById('submitButton');

    // Validate all fields
    if (!validateForm(form)) {
        showMessage('Please fill in all required fields correctly.', 'error');
        return;
    }

    // Disable submit button and show loading
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
    }

    try {
        // Prepare form data
        const formDataObj = new FormData(form);
        const data = Object.fromEntries(formDataObj.entries());

        // Add timestamp and registration ID
        data.timestamp = new Date().toISOString();
        data.registrationId = generateRegistrationId();

        // Submit using Microsoft Forms Handler
        const response = await window.msFormsHandler.submitRegistration(data);

        if (response.success) {
            // Save successful submission data for next page
            localStorage.setItem('lastSubmission', JSON.stringify(data));
            localStorage.setItem('registrationData', JSON.stringify({
                fullName: data.fullName,
                registrationId: response.registrationId || data.registrationId,
                email: data.email,
                phone: data.phone,
                department: data.department,
                yearOfStudy: data.yearOfStudy,
                selectedMaterial: data.selectedMaterial,
                timestamp: data.timestamp,
                craftDescription: data.craftDescription
            }));

            // Clear form data
            localStorage.removeItem('registrationFormData');
            localStorage.removeItem('selectedMaterial');

            // Show success and redirect
            showMessage('Registration successful! Redirecting...', 'success');

            // Handle redirect based on response
            if (response.redirectToMicrosoftForms) {
                // Redirect to Microsoft Forms with pre-filled data
                showMessage('Opening Microsoft Forms for final submission...', 'success');
                setTimeout(() => {
                    window.open(response.microsoftFormsUrl, '_blank');
                    // Also redirect to thanks page for completion
                    setTimeout(() => {
                        window.location.href = 'thanks.html';
                    }, 2000);
                }, 1500);
            } else {
                // Redirect to thanks page directly
                setTimeout(() => {
                    window.location.href = 'thanks.html';
                }, 1500);
            }
        } else {
            throw new Error(response.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Submission error:', error);
        showMessage(`Error: ${error.message}. Please try again.`, 'error');

        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Registration';
        }
    }
}

function validateFieldApp(field) {
    let isValid = true;
    const errorElement = document.getElementById(`${field.name}Error`);

    // Clear previous errors
    field.classList.remove('error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }

    // Required field validation
    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
        if (errorElement) {
            errorElement.textContent = 'This field is required';
            errorElement.style.display = 'block';
        }
        field.classList.add('error');
        updateSubmitButton();
        return isValid;
    }

    // Specific field validations
    switch (field.name) {
        case 'fullName':
            if (field.value.length < 2 || field.value.length > 50) {
                isValid = false;
                if (errorElement) {
                    errorElement.textContent = 'Name must be between 2 and 50 characters';
                    errorElement.style.display = 'block';
                }
                field.classList.add('error');
            }
            break;

        case 'rollNumber':
            const rollPattern = /^[A-Za-z0-9]+$/;
            if (!rollPattern.test(field.value) || field.value.length < 5 || field.value.length > 20) {
                isValid = false;
                if (errorElement) {
                    errorElement.textContent = 'Roll number must be alphanumeric (5-20 characters)';
                    errorElement.style.display = 'block';
                }
                field.classList.add('error');
            }
            break;

        case 'email':
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(field.value)) {
                isValid = false;
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid email address';
                    errorElement.style.display = 'block';
                }
                field.classList.add('error');
            }
            break;

        case 'phone':
            const phonePattern = /^[0-9]{10}$/;
            if (!phonePattern.test(field.value)) {
                isValid = false;
                if (errorElement) {
                    errorElement.textContent = 'Please enter a valid 10-digit mobile number';
                    errorElement.style.display = 'block';
                }
                field.classList.add('error');
            }
            break;

        case 'craftDescription':
            if (field.value.length < 50 || field.value.length > 500) {
                isValid = false;
                if (errorElement) {
                    errorElement.textContent = 'Description must be between 50 and 500 characters';
                    errorElement.style.display = 'block';
                }
                field.classList.add('error');
            }
            break;
    }

    updateSubmitButton();
    return isValid;
}

function updateSubmitButton() {
    const submitButton = document.getElementById('submitButton');
    if (!submitButton) return;

    const form = document.getElementById('registrationForm');
    if (!form) return;

    // Check all required fields
    const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let allValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim() || field.classList.contains('error')) {
            allValid = false;
        }

        // Special validation for craft description length
        if (field.name === 'craftDescription') {
            if (field.value.length < 50 || field.value.length > 500) {
                allValid = false;
            }
        }
    });

    submitButton.disabled = !allValid;
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!validateFieldApp(input)) {
            isValid = false;
        }
    });

    return isValid;
}

function generateRegistrationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ECO-${timestamp}-${random}`.toUpperCase();
}

function showMessage(message, type) {
    const formStatus = document.getElementById('formStatus');
    if (formStatus) {
        formStatus.innerHTML = `<p class="${type}">${message}</p>`;

        // Add styling based on type
        if (type === 'error') {
            formStatus.style.background = 'var(--error)';
            formStatus.style.color = 'white';
        } else if (type === 'success') {
            formStatus.style.background = 'var(--success)';
            formStatus.style.color = 'white';
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            formStatus.innerHTML = '<p>All fields marked with * are required. Please fill in all details to proceed.</p>';
            formStatus.style.background = 'var(--light-gray)';
            formStatus.style.color = 'var(--dark-gray)';
        }, 5000);
    }
}

// Thanks Page Functions
function initializeThanksPage() {
    loadRegistrationSummary();
}

function loadRegistrationSummary() {
    const submissionData = localStorage.getItem('lastSubmission');

    if (submissionData) {
        try {
            const data = JSON.parse(submissionData);

            // Populate summary fields
            const fields = {
                'summaryName': data.fullName,
                'summaryRollNumber': data.rollNumber,
                'summaryEmail': data.email,
                'summaryPhone': data.phone,
                'summaryDepartment': data.department,
                'summaryYear': data.yearOfStudy,
                'summaryMaterial': data.selectedMaterial,
                'summaryDescription': data.craftDescription,
                'registrationId': data.registrationId,
                'registrationDate': formatDate(data.timestamp)
            };

            Object.keys(fields).forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    element.textContent = fields[fieldId];
                }
            });

        } catch (e) {
            console.error('Error loading submission data:', e);
            // Show error message
            const summaryElement = document.querySelector('.registration-summary');
            if (summaryElement) {
                summaryElement.innerHTML = '<p>Error loading registration details. Please contact support.</p>';
            }
        }
    } else {
        // No submission data found
        const summaryElement = document.querySelector('.registration-summary');
        if (summaryElement) {
            summaryElement.innerHTML = '<p>No registration data found. Please complete the registration process.</p>';
        }
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'Date not available';

    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid date';
    }
}

// Utility Functions
function loadSavedData() {
    // Load any general saved data here
    console.log('Application initialized');
}

function downloadSummary() {
    const submissionData = localStorage.getItem('lastSubmission');

    if (submissionData) {
        try {
            const data = JSON.parse(submissionData);

            // Create text content for download
            const content = `
Eco-Pots Registration Summary
=============================
Registration ID: ${data.registrationId}
Registration Date: ${formatDate(data.timestamp)}

Personal Information:
- Name: ${data.fullName}
- Roll Number: ${data.rollNumber}
- Email: ${data.email}
- Phone: ${data.phone}

Academic Details:
- Department: ${data.department}
- Year of Study: ${data.yearOfStudy}

Project Details:
- Selected Material: ${data.selectedMaterial}
- Craft Description: ${data.craftDescription}

Thank you for joining the Eco-Pots initiative!
            `.trim();

            // Create download link
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `EcoPots_Registration_${data.registrationId}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (e) {
            console.error('Error downloading summary:', e);
            alert('Error downloading summary. Please try again.');
        }
    } else {
        alert('No registration data available for download.');
    }
}

function joinWhatsAppGroup() {
    // WhatsApp group link - this should be configured in environment variables
    const whatsappLink = localStorage.getItem('whatsappGroupLink') || 'https://chat.whatsapp.com/example';
    window.open(whatsappLink, '_blank');
}

function shareInitiative() {
    const shareData = {
        title: 'Eco-Pots Initiative',
        text: 'Join me in transforming waste into green classrooms! I\'ve registered for the Eco-Pots initiative and you can too.',
        url: window.location.origin
    };

    if (navigator.share) {
        navigator.share(shareData)
            .catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback - copy to clipboard
        const text = `${shareData.text} ${shareData.url}`;
        navigator.clipboard.writeText(text)
            .then(() => {
                alert('Link copied to clipboard! Share it with your friends.');
            })
            .catch(err => {
                console.error('Error copying to clipboard:', err);
                alert('Error sharing. Please copy the link manually.');
            });
    }
}

// Clear all saved data (for testing purposes)
function clearAllData() {
    localStorage.removeItem('selectedMaterial');
    localStorage.removeItem('registrationFormData');
    localStorage.removeItem('lastSubmission');
    console.log('All saved data cleared');
}

// Export functions for external use if needed
window.EcoPots = {
    selectMaterial,
    proceedToRegistration,
    handleSubmit,
    downloadSummary,
    joinWhatsAppGroup,
    shareInitiative,
    clearAllData
};