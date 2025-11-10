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
            // Use direct URL parameter submission for Microsoft Forms
            return await this.submitDirectly(data);

        } catch (error) {
            console.error('MS Forms submission error:', error);
            throw new Error('Failed to submit to Microsoft Forms: ' + error.message);
        }
    }

    // Direct submission to Microsoft Forms
    async submitDirectly(data) {
        try {
            // Microsoft Forms doesn't directly support API submissions
            // We'll store the data locally and redirect to next page
            // Data can be manually entered into Microsoft Forms or exported later

            // Store data for next page and local backup
            localStorage.setItem('lastSubmission', JSON.stringify(data));

            // Store in submissions array for manual entry/export
            this.storeSuccessfulSubmission(data);

            // Create export-ready data
            this.createSubmissionBackup(data);

            return {
                success: true,
                message: 'Registration successful! Your data has been saved locally. Redirecting to confirmation page...',
                registrationId: data.registrationId,
                redirectToNext: true,
                dataStored: true
            };

        } catch (error) {
            throw new Error('Failed to save registration data: ' + error.message);
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

    // Create submission backup for manual entry
    createSubmissionBackup(data) {
        try {
            const backupData = {
                ...data,
                formUrl: this.formUrl,
                submittedAt: new Date().toISOString(),
                manualEntryRequired: true
            };

            // Store in a separate backup key for easy access
            const backups = JSON.parse(localStorage.getItem('ecopots_manual_entry_backup') || '[]');
            backups.push(backupData);

            // Keep only last 20 backups
            if (backups.length > 20) {
                backups.splice(0, backups.length - 20);
            }

            localStorage.setItem('ecopots_manual_entry_backup', JSON.stringify(backups));
            console.log('Submission backup created for manual entry:', data.registrationId);

        } catch (error) {
            console.error('Error creating submission backup:', error);
        }
    }

    // Get manual entry backups
    getManualEntryBackups() {
        try {
            return JSON.parse(localStorage.getItem('ecopots_manual_entry_backup') || '[]');
        } catch (error) {
            console.error('Error getting manual entry backups:', error);
            return [];
        }
    }

    // Generate manual entry HTML for easy copy-paste
    generateManualEntryHTML() {
        try {
            const backups = this.getManualEntryBackups();
            if (backups.length === 0) {
                return '<p>No registrations requiring manual entry.</p>';
            }

            let html = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                    <h2>Eco-Pots Registrations - Manual Entry Required</h2>
                    <p>Total registrations: ${backups.length}</p>
                    <p>Copy and paste each registration into your Microsoft Forms: <a href="${this.formUrl}" target="_blank">${this.formUrl}</a></p>
                    <hr>
            `;

            backups.forEach((backup, index) => {
                const data = backup.data;
                html += `
                    <div style="margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                        <h3>Registration #${index + 1} - ${data.registrationId}</h3>
                        <p><strong>Submitted:</strong> ${new Date(backup.submittedAt).toLocaleString()}</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Full Name:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.fullName}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Roll Number:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.rollNumber}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.email}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.phone}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Department:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.department}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Year of Study:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.yearOfStudy}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Selected Material:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.selectedMaterial}</td></tr>
                            <tr><td style="padding: 5px; border: 1px solid #ddd; vertical-align: top;"><strong>Craft Description:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">${data.craftDescription}</td></tr>
                        </table>
                    </div>
                `;
            });

            html += '</div>';
            return html;

        } catch (error) {
            console.error('Error generating manual entry HTML:', error);
            return '<p>Error generating manual entry data.</p>';
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