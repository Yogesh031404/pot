// Form Validation Module for Eco-Pots Registration

// Validation patterns
const validationPatterns = {
    fullName: {
        pattern: /^[a-zA-Z\s]+$/,
        minLength: 2,
        maxLength: 50,
        message: 'Name must contain only letters and spaces (2-50 characters)'
    },
    rollNumber: {
        pattern: /^[A-Za-z0-9]+$/,
        minLength: 5,
        maxLength: 20,
        message: 'Roll number must be alphanumeric (5-20 characters)'
    },
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    phone: {
        pattern: /^[0-9]{10}$/,
        message: 'Please enter a valid 10-digit mobile number'
    },
    craftDescription: {
        minLength: 50,
        maxLength: 500,
        message: 'Description must be between 50 and 500 characters'
    }
};

// Department options validation
const validDepartments = [
    'CSE',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
    'Chemical',
    'Others'
];

// Year of study validation
const validYears = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
];

// Material types validation
const validMaterials = [
    'Plastic Bottles',
    'Ropes & Strings',
    'Old Shoes',
    'Glass Jars',
    'Metal Cans',
    'Other Materials'
];

// Form Validator Class
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
        this.isValid = false;

        if (this.form) {
            this.initialize();
        }
    }

    initialize() {
        // Add event listeners for real-time validation
        this.form.addEventListener('input', (e) => this.handleInput(e));
        this.form.addEventListener('blur', (e) => this.handleBlur(e), true);
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Initial validation state
        this.validateAllFields();
        this.updateSubmitButton();
    }

    handleInput(event) {
        const field = event.target;
        if (this.isFormField(field)) {
            this.validateField(field);
            this.updateSubmitButton();
        }
    }

    handleBlur(event) {
        const field = event.target;
        if (this.isFormField(field)) {
            this.validateField(field);
        }
    }

    handleSubmit(event) {
        event.preventDefault();

        if (this.validateAllFields()) {
            // Call the global handleSubmit function from app.js
            if (typeof window.handleSubmit === 'function') {
                window.handleSubmit(event);
            }
        } else {
            this.showErrors();
            this.focusFirstError();
        }
    }

    isFormField(element) {
        return element.tagName === 'INPUT' ||
               element.tagName === 'SELECT' ||
               element.tagName === 'TEXTAREA';
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearFieldError(field);

        // Check if field is required
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (value) {
            // Field-specific validation
            switch (fieldName) {
                case 'fullName':
                    isValid = this.validateFullName(value);
                    errorMessage = validationPatterns.fullName.message;
                    break;

                case 'rollNumber':
                    isValid = this.validateRollNumber(value);
                    errorMessage = validationPatterns.rollNumber.message;
                    break;

                case 'email':
                    isValid = this.validateEmail(value);
                    errorMessage = validationPatterns.email.message;
                    break;

                case 'phone':
                    isValid = this.validatePhone(value);
                    errorMessage = validationPatterns.phone.message;
                    break;

                case 'department':
                    isValid = this.validateDepartment(value);
                    errorMessage = 'Please select a valid department';
                    break;

                case 'yearOfStudy':
                    isValid = this.validateYearOfStudy(value);
                    errorMessage = 'Please select a valid year of study';
                    break;

                case 'selectedMaterial':
                    isValid = this.validateSelectedMaterial(value);
                    errorMessage = 'Invalid material selected';
                    break;

                case 'craftDescription':
                    const validation = this.validateCraftDescription(value);
                    isValid = validation.valid;
                    errorMessage = validation.message;
                    break;
            }
        }

        // Update field appearance and error message
        if (!isValid) {
            this.showFieldError(field, errorMessage);
            this.errors[fieldName] = errorMessage;
        } else {
            delete this.errors[fieldName];
        }

        return isValid;
    }

    validateFullName(value) {
        const pattern = validationPatterns.fullName.pattern;
        const minLength = validationPatterns.fullName.minLength;
        const maxLength = validationPatterns.fullName.maxLength;

        return pattern.test(value) &&
               value.length >= minLength &&
               value.length <= maxLength;
    }

    validateRollNumber(value) {
        const pattern = validationPatterns.rollNumber.pattern;
        const minLength = validationPatterns.rollNumber.minLength;
        const maxLength = validationPatterns.rollNumber.maxLength;

        return pattern.test(value) &&
               value.length >= minLength &&
               value.length <= maxLength;
    }

    validateEmail(value) {
        const pattern = validationPatterns.email.pattern;
        return pattern.test(value);
    }

    validatePhone(value) {
        const pattern = validationPatterns.phone.pattern;
        return pattern.test(value);
    }

    validateDepartment(value) {
        return validDepartments.includes(value);
    }

    validateYearOfStudy(value) {
        return validYears.includes(value);
    }

    validateSelectedMaterial(value) {
        return validMaterials.includes(value);
    }

    validateCraftDescription(value) {
        const minLength = validationPatterns.craftDescription.minLength;
        const maxLength = validationPatterns.craftDescription.maxLength;

        if (value.length < minLength) {
            return {
                valid: false,
                message: `Description must be at least ${minLength} characters (current: ${value.length})`
            };
        }

        if (value.length > maxLength) {
            return {
                valid: false,
                message: `Description must not exceed ${maxLength} characters (current: ${value.length})`
            };
        }

        // Check for meaningful content (not just repeated characters)
        if (this.isSpamContent(value)) {
            return {
                valid: false,
                message: 'Please provide a meaningful description of your craft idea'
            };
        }

        return {
            valid: true,
            message: ''
        };
    }

    isSpamContent(text) {
        // Check for repeated characters or patterns
        const repeatedPattern = /(.)\1{4,}/; // 5 or more repeated characters
        if (repeatedPattern.test(text)) {
            return true;
        }

        // Check for common spam patterns
        const spamPatterns = [
            /test/i,
            /asdf/i,
            /qwerty/i,
            /12345/i,
            /aaaa/i,
            /bbbb/i
        ];

        return spamPatterns.some(pattern => pattern.test(text));
    }

    validateAllFields() {
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isFormValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        this.isValid = isFormValid;
        return isFormValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');

        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        // Add ARIA attributes for accessibility
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', `${field.name}Error`);
    }

    clearFieldError(field) {
        field.classList.remove('error');

        const errorElement = document.getElementById(`${field.name}Error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }

        // Remove ARIA attributes
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    }

    showErrors() {
        Object.keys(this.errors).forEach(fieldName => {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field, this.errors[fieldName]);
            }
        });
    }

    focusFirstError() {
        const firstErrorField = this.form.querySelector('.error');
        if (firstErrorField) {
            firstErrorField.focus();
            firstErrorField.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    updateSubmitButton() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = !this.isValid;
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData.entries());
    }

    reset() {
        this.errors = {};
        this.isValid = false;

        // Clear all field errors
        const fields = this.form.querySelectorAll('input, select, textarea');
        fields.forEach(field => this.clearFieldError(field));

        // Update submit button
        this.updateSubmitButton();
    }
}

// Advanced validation utilities
const ValidationUtils = {
    // Validate Indian phone numbers (optional +91 prefix)
    validateIndianPhone: function(phone) {
        const pattern = /^(\+91[-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return pattern.test(phone.replace(/\s/g, ''));
    },

    // Validate college roll numbers (common formats)
    validateCollegeRollNumber: function(rollNumber) {
        const patterns = [
            /^[A-Z]{2,4}\d{4,8}$/, // College code + numbers
            /^\d{2}[A-Z]{2,4}\d{4,8}$/, // Year + college code + numbers
            /^[A-Z0-9]{5,20}$/ // General alphanumeric
        ];

        return patterns.some(pattern => pattern.test(rollNumber.toUpperCase()));
    },

    // Check for duplicate email (mock implementation)
    checkDuplicateEmail: async function(email) {
        // This would typically make an API call to check for duplicates
        // For now, just return false (no duplicate)
        return false;
    },

    // Check for duplicate roll number (mock implementation)
    checkDuplicateRollNumber: async function(rollNumber) {
        // This would typically make an API call to check for duplicates
        // For now, just return false (no duplicate)
        return false;
    },

    // Sanitize user input
    sanitizeInput: function(input) {
        return input
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .slice(0, 1000); // Limit length
    },

    // Validate file upload (if implemented later)
    validateFile: function(file, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
        if (!file) return { valid: false, message: 'No file selected' };

        if (file.size > maxSizeMB * 1024 * 1024) {
            return {
                valid: false,
                message: `File size must be less than ${maxSizeMB}MB`
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed'
            };
        }

        return { valid: true, message: '' };
    }
};

// Initialize form validator when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        window.formValidator = new FormValidator('registrationForm');
    }
});

// Export for external use
window.FormValidator = FormValidator;
window.ValidationUtils = ValidationUtils;