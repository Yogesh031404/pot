// Simple Form Handler - No Google Scripts Required!
// Uses Netlify Forms for data collection

class SimpleFormHandler {
    constructor() {
        this.isOnline = navigator.onLine;
        this.formStorage = [];

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Back online - form submission available');
            this.retryStoredForms();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Offline - forms will be stored locally');
        });

        // Load any stored forms
        this.loadStoredForms();
    }

    // Main form submission function
    async submitRegistration(formData) {
        try {
            // Add timestamp and registration ID
            const submissionData = {
                ...formData,
                timestamp: new Date().toISOString(),
                registrationId: this.generateRegistrationId(),
                submissionSource: 'Eco-Pots Web App'
            };

            if (!this.isOnline) {
                // Store form for later submission
                this.storeForm(submissionData);
                return {
                    success: true,
                    data: submissionData,
                    message: 'Registration saved! It will be submitted when you\'re back online.',
                    registrationId: submissionData.registrationId,
                    offlineMode: true
                };
            }

            // Submit to Netlify Forms
            const response = await this.submitToNetlify(submissionData);

            if (response.success) {
                // Store successful submission locally
                this.storeSuccessfulSubmission(submissionData);
                return {
                    success: true,
                    data: submissionData,
                    message: 'Registration submitted successfully!',
                    registrationId: submissionData.registrationId
                };
            } else {
                throw new Error(response.message || 'Submission failed');
            }

        } catch (error) {
            console.error('Form submission error:', error);

            // Store form for retry if online submission fails
            if (this.isOnline) {
                this.storeForm(submissionData);
            }

            return {
                success: false,
                message: error.message || 'Failed to submit registration. Form saved for retry.',
                retryAvailable: true,
                offlineMode: !this.isOnline
            };
        }
    }

    // Submit form using Netlify Forms
    async submitToNetlify(data) {
        try {
            // Create FormData for Netlify
            const formData = new FormData();

            // Add all form fields
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });

            // Add Netlify-specific fields
            formData.append('form-name', 'ecopots-registration');

            // Submit to Netlify
            const response = await fetch('/', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                return { success: true };
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

        } catch (error) {
            console.error('Netlify submission error:', error);
            throw new Error('Failed to submit to Netlify Forms');
        }
    }

    // Store form locally for retry when offline
    storeForm(formData) {
        try {
            const storedForms = JSON.parse(localStorage.getItem('ecopots_stored_forms') || '[]');
            storedForms.push({
                id: `stored_${Date.now()}`,
                timestamp: new Date().toISOString(),
                data: formData
            });

            // Keep only last 10 stored forms
            if (storedForms.length > 10) {
                storedForms.splice(0, storedForms.length - 10);
            }

            localStorage.setItem('ecopots_stored_forms', JSON.stringify(storedForms));
            console.log('Form stored for later submission:', formData.registrationId);

        } catch (error) {
            console.error('Error storing form:', error);
        }
    }

    // Load stored forms from localStorage
    loadStoredForms() {
        try {
            const stored = localStorage.getItem('ecopots_stored_forms');
            this.formStorage = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading stored forms:', error);
            this.formStorage = [];
        }
    }

    // Retry submitting stored forms when back online
    async retryStoredForms() {
        if (this.formStorage.length === 0) return;

        console.log(`Retrying ${this.formStorage.length} stored forms...`);

        for (const storedForm of this.formStorage) {
            try {
                const response = await this.submitToNetlify(storedForm.data);
                if (response.success) {
                    console.log(`Successfully submitted stored form: ${storedForm.data.registrationId}`);
                    this.removeStoredForm(storedForm.id);
                }
            } catch (error) {
                console.error(`Failed to retry form ${storedForm.data.registrationId}:`, error);
            }
        }
    }

    // Remove successfully submitted form from storage
    removeStoredForm(formId) {
        this.formStorage = this.formStorage.filter(form => form.id !== formId);
        localStorage.setItem('ecopots_stored_forms', JSON.stringify(this.formStorage));
    }

    // Store successful submission
    storeSuccessfulSubmission(data) {
        try {
            const successfulSubmissions = JSON.parse(localStorage.getItem('ecopots_successful_submissions') || '[]');
            successfulSubmissions.push({
                id: data.registrationId,
                timestamp: data.timestamp,
                data: data
            });

            // Keep only last 50 successful submissions
            if (successfulSubmissions.length > 50) {
                successfulSubmissions.splice(0, successfulSubmissions.length - 50);
            }

            localStorage.setItem('ecopots_successful_submissions', JSON.stringify(successfulSubmissions));

        } catch (error) {
            console.error('Error storing successful submission:', error);
        }
    }

    // Generate unique registration ID
    generateRegistrationId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ECO-${timestamp}-${random}`.toUpperCase();
    }

    // Get submission statistics
    getSubmissionStats() {
        try {
            const successful = JSON.parse(localStorage.getItem('ecopots_successful_submissions') || '[]');
            const stored = this.formStorage;

            return {
                successful: successful.length,
                stored: stored.length,
                total: successful.length + stored.length,
                lastSuccessful: successful.length > 0 ? successful[successful.length - 1].timestamp : null,
                isOnline: this.isOnline
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                successful: 0,
                stored: 0,
                total: 0,
                lastSuccessful: null,
                isOnline: this.isOnline
            };
        }
    }

    // Export submissions as CSV
    exportSubmissionsAsCSV() {
        try {
            const successfulSubmissions = JSON.parse(localStorage.getItem('ecopots_successful_submissions') || '[]');

            if (successfulSubmissions.length === 0) {
                alert('No submissions to export');
                return;
            }

            // Create CSV headers
            const headers = [
                'Registration ID',
                'Timestamp',
                'Full Name',
                'Roll Number',
                'Email Address',
                'Department',
                'Phone Number',
                'Year of Study',
                'Selected Material',
                'Craft Description',
                'Status',
                'Submission Source'
            ];

            // Create CSV rows
            const rows = successfulSubmissions.map(submission => {
                const data = submission.data;
                return [
                    data.registrationId || '',
                    data.timestamp || '',
                    data.fullName || '',
                    data.rollNumber || '',
                    data.email || '',
                    data.department || '',
                    data.phone || '',
                    data.yearOfStudy || '',
                    data.selectedMaterial || '',
                    `"${(data.craftDescription || '').replace(/"/g, '""')}"`, // Escape quotes in description
                    'Submitted',
                    data.submissionSource || ''
                ];
            });

            // Combine headers and rows
            const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');

            // Create and download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ecopots_registrations_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`Exported ${successfulSubmissions.length} submissions as CSV`);

        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export submissions');
        }
    }

    // Clear all local data
    clearLocalData() {
        try {
            localStorage.removeItem('ecopots_stored_forms');
            localStorage.removeItem('ecopots_successful_submissions');
            this.formStorage = [];
            console.log('Cleared all local form data');
        } catch (error) {
            console.error('Error clearing local data:', error);
        }
    }

    // Get stored forms count
    getStoredFormsCount() {
        return this.formStorage.length;
    }

    // Check service availability (always true for Netlify Forms)
    async checkServiceAvailability() {
        return {
            available: true,
            message: this.isOnline ? 'Netlify Forms available' : 'Offline mode - forms will be stored locally',
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize form handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.simpleFormHandler = new SimpleFormHandler();
});

// Export for external use
window.SimpleFormHandler = SimpleFormHandler;