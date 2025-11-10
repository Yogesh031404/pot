// Microsoft Forms Handler for Eco-Pots Registration
// Submits data to Microsoft Forms via Power Automate or direct API

class MSFormsHandler {
    constructor() {
        // Microsoft Forms URL pre-configured
        this.formUrl = 'https://forms.office.com/r/f3Vim0S7AC';
        this.isOnline = navigator.onLine;

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Back online - Microsoft Forms submission available');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Offline - forms will be stored locally');
        });

        // Load any stored forms
        this.loadStoredForms();
    }

    // Set Microsoft Forms URL
    setFormUrl(url) {
        this.formUrl = url;
        localStorage.setItem('ecopots_ms_form_url', url);
        console.log('Microsoft Forms URL set:', url);
    }

    // Load form URL from localStorage
    loadFormUrl() {
        const savedUrl = localStorage.getItem('ecopots_ms_form_url');
        if (savedUrl) {
            this.formUrl = savedUrl;
            return true;
        }
        return false;
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

            if (!this.formUrl) {
                throw new Error('Microsoft Forms URL not configured. Please set the form URL first.');
            }

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

            // Submit to Microsoft Forms
            const response = await this.submitToMSForms(submissionData);

            if (response.success) {
                // Store successful submission locally
                this.storeSuccessfulSubmission(submissionData);
                return {
                    success: true,
                    data: submissionData,
                    message: 'Registration submitted successfully to Microsoft Forms!',
                    registrationId: submissionData.registrationId
                };
            } else {
                throw new Error(response.message || 'Submission failed');
            }

        } catch (error) {
            console.error('Microsoft Forms submission error:', error);

            // Store form for retry if online submission fails
            if (this.isOnline && error.message !== 'Microsoft Forms URL not configured.') {
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

    // Submit form to Microsoft Forms
    async submitToMSForms(data) {
        try {
            // Method 1: Direct form submission (if form allows external submissions)
            if (this.formUrl.includes('forms.office.com')) {
                return await this.submitDirectly(data);
            }

            // Method 2: Power Automate flow (recommended)
            return await this.submitViaPowerAutomate(data);

        } catch (error) {
            console.error('MS Forms submission error:', error);
            throw new Error('Failed to submit to Microsoft Forms: ' + error.message);
        }
    }

    // Direct submission to Microsoft Forms
    async submitDirectly(data) {
        try {
            // Microsoft Forms doesn't directly support API submissions
            // This is a fallback method that opens the form in a new window
            // with pre-filled data

            const formData = this.formatFormDataForMSForms(data);
            const formUrlWithParams = `${this.formUrl}?${formData}`;

            // Open form in new window
            window.open(formUrlWithParams, '_blank', 'width=800,height=600');

            return {
                success: true,
                message: 'Microsoft Forms opened in new window. Please complete and submit the form there.',
                manualCompletion: true
            };

        } catch (error) {
            throw new Error('Failed to open Microsoft Forms: ' + error.message);
        }
    }

    // Submit via Power Automate (recommended method)
    async submitViaPowerAutomate(data) {
        try {
            // This requires setting up a Power Automate flow with HTTP trigger
            // The flow URL should be configured as an environment variable

            const powerAutomateUrl = localStorage.getItem('ecopots_power_automate_url');

            if (!powerAutomateUrl) {
                throw new Error('Power Automate URL not configured. Please set up a Power Automate flow or use direct submission.');
            }

            const response = await fetch(powerAutomateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return { success: true, data: result };

        } catch (error) {
            throw new Error('Power Automate submission failed: ' + error.message);
        }
    }

    // Format data for Microsoft Forms URL parameters
    formatFormDataForMSForms(data) {
        const params = new URLSearchParams();

        // Microsoft Forms field names (these need to match your form fields)
        params.append('entry.1', data.fullName || '');
        params.append('entry.2', data.rollNumber || '');
        params.append('entry.3', data.email || '');
        params.append('entry.4', data.phone || '');
        params.append('entry.5', data.department || '');
        params.append('entry.6', data.yearOfStudy || '');
        params.append('entry.7', data.selectedMaterial || '');
        params.append('entry.8', data.craftDescription || '');

        return params.toString();
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
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading stored forms:', error);
            return [];
        }
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
            const stored = this.loadStoredForms();

            return {
                successful: successful.length,
                stored: stored.length,
                total: successful.length + stored.length,
                lastSuccessful: successful.length > 0 ? successful[successful.length - 1].timestamp : null,
                isOnline: this.isOnline,
                formUrlConfigured: !!this.formUrl
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                successful: 0,
                stored: 0,
                total: 0,
                lastSuccessful: null,
                isOnline: this.isOnline,
                formUrlConfigured: !!this.formUrl
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
                    `"${(data.craftDescription || '').replace(/"/g, '""')}"`, // Escape quotes
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
            console.log('Cleared all local form data');
        } catch (error) {
            console.error('Error clearing local data:', error);
        }
    }

    // Check service availability
    async checkServiceAvailability() {
        return {
            available: this.isOnline && !!this.formUrl,
            message: this.formUrl ?
                (this.isOnline ? 'Microsoft Forms available' : 'Offline mode - forms will be stored locally') :
                'Microsoft Forms URL not configured',
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize MS Forms handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.msFormsHandler = new MSFormsHandler();

    // Load saved form URL
    window.msFormsHandler.loadFormUrl();
});

// Export for external use
window.MSFormsHandler = MSFormsHandler;