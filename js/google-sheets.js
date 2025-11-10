// Google Sheets Integration for Eco-Pots Registration

// Configuration - loads from localStorage or environment variables
const CONFIG = {
    GOOGLE_SCRIPT_URL: window.GOOGLE_SCRIPT_URL || localStorage.getItem('ecopots_script_url') || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec',
    SPREADSHEET_ID: window.SPREADSHEET_ID || localStorage.getItem('ecopots_spreadsheet_id') || 'https://docs.google.com/spreadsheets/d/1N3kwsrMPHSJo-9K7IgWbtLPwRxLZBBAL_O4y7KNHvtg/edit?gid=0#gid=0',
    SHEET_NAME: 'EcoPots_Student_Registrations',
    MAX_RETRIES: 3,
    TIMEOUT: 30000 // 30 seconds
};

// Google Sheets API Manager
class GoogleSheetsManager {
    constructor(config = {}) {
        this.config = { ...CONFIG, ...config };
        this.isOnline = navigator.onLine;
        this.retryCount = 0;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Back online - Google Sheets integration available');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Offline - Google Sheets integration unavailable');
        });
    }

    // Main submission function
    async submitRegistration(formData) {
        try {
            // Check connectivity
            if (!this.isOnline) {
                throw new Error('You are currently offline. Please check your internet connection and try again.');
            }

            // Validate required fields
            const validationResult = this.validateSubmissionData(formData);
            if (!validationResult.valid) {
                throw new Error(validationResult.message);
            }

            // Prepare data for submission
            const submissionData = this.prepareSubmissionData(formData);

            // Submit to Google Sheets
            const response = await this.sendToGoogleSheets(submissionData);

            // Handle response
            if (response.success) {
                // Store successful submission locally
                this.storeSuccessfulSubmission(submissionData);
                return {
                    success: true,
                    data: response.data,
                    message: 'Registration submitted successfully!',
                    registrationId: formData.registrationId
                };
            } else {
                throw new Error(response.message || 'Submission failed');
            }

        } catch (error) {
            console.error('Google Sheets submission error:', error);

            // Store failed submission for retry
            this.storeFailedSubmission(formData);

            return {
                success: false,
                message: error.message || 'Failed to submit registration',
                retryAvailable: this.isOnline && this.retryCount < this.config.MAX_RETRIES
            };
        }
    }

    // Validate submission data
    validateSubmissionData(data) {
        const requiredFields = [
            'fullName',
            'rollNumber',
            'email',
            'phone',
            'department',
            'yearOfStudy',
            'selectedMaterial',
            'craftDescription',
            'registrationId'
        ];

        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                return {
                    valid: false,
                    message: `Missing required field: ${field}`
                };
            }
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(data.email)) {
            return {
                valid: false,
                message: 'Invalid email address'
            };
        }

        // Validate phone number
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(data.phone)) {
            return {
                valid: false,
                message: 'Invalid phone number'
            };
        }

        return { valid: true };
    }

    // Prepare data for Google Sheets submission
    prepareSubmissionData(formData) {
        const timestamp = new Date().toISOString();

        return {
            timestamp: timestamp,
            fullName: this.sanitizeData(formData.fullName),
            rollNumber: this.sanitizeData(formData.rollNumber),
            email: this.sanitizeData(formData.email),
            department: formData.department,
            phone: this.sanitizeData(formData.phone),
            yearOfStudy: formData.yearOfStudy,
            selectedMaterial: formData.selectedMaterial,
            craftDescription: this.sanitizeData(formData.craftDescription),
            registrationId: formData.registrationId,
            status: 'New',
            userAgent: navigator.userAgent,
            submissionSource: 'Eco-Pots Web App',
            ipAddress: '' // Will be populated by Google Apps Script
        };
    }

    // Send data to Google Sheets via Google Apps Script
    async sendToGoogleSheets(data) {
        const payload = {
            action: 'submitRegistration',
            data: data,
            spreadsheetId: this.config.SPREADSHEET_ID,
            sheetName: this.config.SHEET_NAME
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);

            const response = await fetch(this.config.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
                mode: 'cors'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Reset retry count on success
            this.retryCount = 0;

            return result;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            } else {
                throw error;
            }
        }
    }

    // Retry failed submissions
    async retryFailedSubmissions() {
        const failedSubmissions = this.getFailedSubmissions();

        if (failedSubmissions.length === 0) {
            return { success: true, message: 'No failed submissions to retry' };
        }

        const results = [];

        for (const submission of failedSubmissions) {
            try {
                const result = await this.submitRegistration(submission.data);
                if (result.success) {
                    this.removeFailedSubmission(submission.id);
                    results.push({
                        id: submission.id,
                        success: true,
                        message: 'Successfully retried submission'
                    });
                } else {
                    results.push({
                        id: submission.id,
                        success: false,
                        message: result.message
                    });
                }
            } catch (error) {
                results.push({
                    id: submission.id,
                    success: false,
                    message: error.message
                });
            }
        }

        return {
            success: true,
            message: `Retried ${failedSubmissions.length} submissions`,
            results: results
        };
    }

    // Store successful submission locally
    storeSuccessfulSubmission(data) {
        try {
            const successfulSubmissions = JSON.parse(localStorage.getItem('successfulSubmissions') || '[]');
            successfulSubmissions.push({
                id: data.registrationId,
                timestamp: data.timestamp,
                data: data
            });

            // Keep only last 10 successful submissions
            if (successfulSubmissions.length > 10) {
                successfulSubmissions.splice(0, successfulSubmissions.length - 10);
            }

            localStorage.setItem('successfulSubmissions', JSON.stringify(successfulSubmissions));
        } catch (error) {
            console.error('Error storing successful submission:', error);
        }
    }

    // Store failed submission for retry
    storeFailedSubmission(data) {
        try {
            const failedSubmissions = this.getFailedSubmissions();
            const submissionId = `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            failedSubmissions.push({
                id: submissionId,
                timestamp: new Date().toISOString(),
                retryCount: this.retryCount,
                data: data
            });

            // Keep only last 5 failed submissions
            if (failedSubmissions.length > 5) {
                failedSubmissions.splice(0, failedSubmissions.length - 5);
            }

            localStorage.setItem('failedSubmissions', JSON.stringify(failedSubmissions));
        } catch (error) {
            console.error('Error storing failed submission:', error);
        }
    }

    // Get failed submissions from localStorage
    getFailedSubmissions() {
        try {
            return JSON.parse(localStorage.getItem('failedSubmissions') || '[]');
        } catch (error) {
            console.error('Error retrieving failed submissions:', error);
            return [];
        }
    }

    // Remove failed submission after successful retry
    removeFailedSubmission(submissionId) {
        try {
            const failedSubmissions = this.getFailedSubmissions();
            const updatedSubmissions = failedSubmissions.filter(sub => sub.id !== submissionId);
            localStorage.setItem('failedSubmissions', JSON.stringify(updatedSubmissions));
        } catch (error) {
            console.error('Error removing failed submission:', error);
        }
    }

    // Get submission statistics
    getSubmissionStats() {
        try {
            const successful = JSON.parse(localStorage.getItem('successfulSubmissions') || '[]');
            const failed = this.getFailedSubmissions();

            return {
                successful: successful.length,
                failed: failed.length,
                total: successful.length + failed.length,
                lastSuccessful: successful.length > 0 ? successful[successful.length - 1].timestamp : null,
                isOnline: this.isOnline
            };
        } catch (error) {
            console.error('Error getting submission stats:', error);
            return {
                successful: 0,
                failed: 0,
                total: 0,
                lastSuccessful: null,
                isOnline: this.isOnline
            };
        }
    }

    // Clear all local submission data
    clearLocalData() {
        try {
            localStorage.removeItem('successfulSubmissions');
            localStorage.removeItem('failedSubmissions');
            console.log('Cleared all local submission data');
        } catch (error) {
            console.error('Error clearing local data:', error);
        }
    }

    // Sanitize data before submission
    sanitizeData(data) {
        if (typeof data !== 'string') return data;

        return data
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/["']/g, '') // Remove quotes
            .slice(0, 500); // Limit length
    }

    // Check if Google Sheets service is available
    async checkServiceAvailability() {
        try {
            const payload = {
                action: 'ping',
                timestamp: new Date().toISOString()
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(this.config.GOOGLE_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            return {
                available: response.ok,
                message: response.ok ? 'Service available' : 'Service unavailable'
            };

        } catch (error) {
            return {
                available: false,
                message: error.message || 'Service check failed'
            };
        }
    }
}

// Initialize Google Sheets manager
let googleSheetsManager;

document.addEventListener('DOMContentLoaded', function() {
    googleSheetsManager = new GoogleSheetsManager();

    // Check service availability
    googleSheetsManager.checkServiceAvailability().then(result => {
        console.log('Google Sheets service status:', result);
    });

    // Make available globally
    window.googleSheetsManager = googleSheetsManager;
});

// Export for external use
window.GoogleSheetsManager = GoogleSheetsManager;
