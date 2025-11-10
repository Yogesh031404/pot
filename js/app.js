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

function proceedToMicrosoftForms() {
    if (selectedMaterial) {
        // Save selection and go directly to Microsoft Forms
        const materialName = materialTypes[selectedMaterial] || selectedMaterial;

        // Save for potential tracking/display purposes
        localStorage.setItem('selectedMaterial', selectedMaterial);

        // Generate registration ID for tracking
        const registrationId = generateRegistrationId();
        localStorage.setItem('registrationId', registrationId);

        // Redirect to thanks page with information
        localStorage.setItem('materialSelection', JSON.stringify({
            selectedMaterial: materialName,
            registrationId: registrationId,
            timestamp: new Date().toISOString(),
            redirectToForms: true
        }));

        // Show success message and redirect to Microsoft Forms directly
        if (confirm('Great choice! Click OK to open Microsoft Forms and complete your registration. After submission, you will return to the confirmation page.')) {
            // Redirect directly to Microsoft Forms (same tab)
            window.location.href = 'https://forms.office.com/r/f3Vim0S7AC';
        }
    } else {
        alert('Please select a material first before proceeding.');
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
    updateMicrosoftFormsNotice();
}

function updateMicrosoftFormsNotice() {
    const noticeElement = document.getElementById('microsoftFormsNotice');
    const materialSelection = localStorage.getItem('materialSelection');

    if (!noticeElement) return;

    let content = '';

    if (materialSelection) {
        const data = JSON.parse(materialSelection);

        if (data.redirectToForms && !data.formsCompleted) {
            // User just arrived from materials page, need to complete forms
            content = `
                <h3 style="color: var(--dark-green); margin-bottom: 10px;">📋 Complete Your Registration</h3>
                <p style="margin-bottom: 15px;">
                    <strong>Great!</strong> You've selected: <span style="background: var(--primary-green); color: white; padding: 2px 8px; border-radius: 4px;">${data.selectedMaterial}</span>
                </p>
                <p style="margin-bottom: 15px;">
                    Please complete your registration by filling out the Microsoft Forms. After submission, return to this page for your confirmation.
                </p>
                <div style="background: var(--white); padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px dashed var(--accent-green);">
                    <p style="margin: 0; text-align: center;">
                        <strong>📝 Click the button below to open Microsoft Forms:</strong><br>
                        <span style="color: var(--text-secondary); font-size: 14px;">After completing the form, use your browser's back button or return to this page</span>
                    </p>
                </div>
                <button
                    onclick="window.open('https://forms.office.com/r/f3Vim0S7AC', '_blank')"
                    style="background: var(--primary-green); color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; transition: all 0.3s ease; width: 100%;"
                    onmouseover="this.style.background='var(--dark-green)'; this.style.transform='translateY(-2px)';"
                    onmouseout="this.style.background='var(--primary-green)'; this.style.transform='translateY(0)';"
                >
                    📝 Complete Microsoft Forms Registration
                </button>
                <p style="margin-top: 15px; font-size: 14px; color: var(--text-secondary);">
                    <strong>Registration ID:</strong> ${data.registrationId}
                </p>
            `;
        } else {
            // User has completed or is returning
            content = `
                <h3 style="color: var(--dark-green); margin-bottom: 10px;">✅ Registration Almost Complete!</h3>
                <p style="margin-bottom: 15px;">
                    <strong>Material Selected:</strong> <span style="background: var(--primary-green); color: white; padding: 2px 8px; border-radius: 4px;">${data.selectedMaterial}</span>
                </p>
                <div style="background: var(--success); color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0;">
                        <strong>🎉 Thank you!</strong> Your registration journey is complete when you submit the Microsoft Forms.
                    </p>
                </div>
                <button
                    onclick="window.open('https://forms.office.com/r/f3Vim0S7AC', '_blank')"
                    style="background: var(--light-green); color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; transition: all 0.3s ease; width: 100%;"
                    onmouseover="this.style.background='var(--primary-green)';"
                    onmouseout="this.style.background='var(--light-green)';"
                >
                    📝 Access Microsoft Forms Again
                </button>
                <p style="margin-top: 15px; font-size: 14px; color: var(--text-secondary);">
                    <strong>Registration ID:</strong> ${data.registrationId} | <strong>Selected on:</strong> ${formatDate(data.timestamp)}
                </p>
            `;
        }
    } else {
        // General message for users who land directly on thanks page
        content = `
            <h3 style="color: var(--dark-green); margin-bottom: 10px;">🌱 Welcome to Eco-Pots!</h3>
            <p style="margin-bottom: 15px;">
                Join our initiative to transform waste into green classrooms!
            </p>
            <div style="background: var(--white); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="color: var(--primary-green); margin-bottom: 10px;">🚀 Get Started:</h4>
                <ol style="margin: 0; padding-left: 20px;">
                    <li>Select your waste material</li>
                    <li>Complete Microsoft Forms registration</li>
                    <li>Transform waste into green spaces!</li>
                </ol>
            </div>
            <button
                onclick="window.location.href='index.html'"
                style="background: var(--primary-green); color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500; transition: all 0.3s ease; width: 100%;"
                onmouseover="this.style.background='var(--dark-green)'; this.style.transform='translateY(-2px)';"
                onmouseout="this.style.background='var(--primary-green)'; this.style.transform='translateY(0)';"
            >
                🏠 Start Registration
            </button>
        `;
    }

    noticeElement.innerHTML = content;
}

// Function to mark Microsoft Forms as completed
function markFormsCompleted() {
    const materialSelection = localStorage.getItem('materialSelection');
    if (materialSelection) {
        const data = JSON.parse(materialSelection);
        data.formsCompleted = true;
        data.completedAt = new Date().toISOString();
        localStorage.setItem('materialSelection', JSON.stringify(data));

        // Refresh the page to show completed state
        updateMicrosoftFormsNotice();
        loadRegistrationSummary();

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: var(--success); color: white; padding: 15px 20px;
            border-radius: 8px; box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s ease-out;
        `;
        successMessage.innerHTML = '🎉 Congratulations! Your registration is complete!';
        document.body.appendChild(successMessage);

        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }
}

function loadRegistrationSummary() {
    const materialSelection = localStorage.getItem('materialSelection');
    const registrationId = localStorage.getItem('registrationId');
    const selectedMaterial = localStorage.getItem('selectedMaterial');

    if (materialSelection || (selectedMaterial && registrationId)) {
        try {
            let data = {};
            if (materialSelection) {
                data = JSON.parse(materialSelection);
            } else {
                data = {
                    selectedMaterial: materialTypes[selectedMaterial] || selectedMaterial,
                    registrationId: registrationId,
                    timestamp: new Date().toISOString()
                };
            }

            // Update summary for simplified flow - focus on material selection and Microsoft Forms
            const summaryElement = document.querySelector('.registration-summary');
            if (summaryElement) {
                summaryElement.innerHTML = `
                    <div class="simple-summary" style="text-align: center; padding: 20px;">
                        <h3 style="color: var(--primary-green); margin-bottom: 20px;">🌱 Material Selection Confirmed!</h3>
                        <div style="background: var(--pale-green); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <h4>Registration ID: ${data.registrationId || 'ECO-' + Date.now().toString(36).toUpperCase()}</h4>
                            <p><strong>Selected Material:</strong> ${data.selectedMaterial}</p>
                            <p><strong>Selection Date:</strong> ${formatDate(data.timestamp)}</p>
                        </div>
                        <p style="color: var(--text-secondary); margin-top: 20px;">
                            Your material choice has been saved. Please complete the registration by filling out the Microsoft Forms.
                        </p>
                    </div>
                `;
            }

        } catch (e) {
            console.error('Error loading material selection data:', e);
            // Show simple message
            const summaryElement = document.querySelector('.registration-summary');
            if (summaryElement) {
                summaryElement.innerHTML = `
                    <div class="simple-summary" style="text-align: center; padding: 20px;">
                        <h3 style="color: var(--primary-green);">🌱 Welcome to Eco-Pots!</h3>
                        <p>Thank you for selecting your material. Please complete your registration by filling out the Microsoft Forms.</p>
                    </div>
                `;
            }
        }
    } else {
        // No selection data found
        const summaryElement = document.querySelector('.registration-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <div class="simple-summary" style="text-align: center; padding: 20px;">
                    <h3 style="color: var(--primary-green);">🌱 Welcome to Eco-Pots!</h3>
                    <p>Your journey begins here. Please start from the home page to select your material and complete registration.</p>
                    <a href="index.html" style="display: inline-block; background: var(--primary-green); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 15px;">
                        Go to Home Page
                    </a>
                </div>
            `;
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