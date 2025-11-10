# Google Sheets Integration Setup Guide

This guide will help you set up the Google Sheets integration for the Eco-Pots registration form.

## 🔧 Quick Setup Steps

### 1. Open the Debug Page
First, open the debug connection page to test your setup:
```
http://localhost:8000/debug-connection.html
```
or after deployment:
```
https://your-domain.com/debug-connection.html
```

### 2. Create Google Spreadsheet

1. **Go to Google Sheets**: https://sheets.google.com
2. **Click "Blank"** to create a new spreadsheet
3. **Name it**: "EcoPots_Student_Registrations"
4. **Copy the Spreadsheet ID** from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Your ID is: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 3. Set up Google Apps Script

1. **Go to Google Apps Script**: https://script.google.com
2. **Click "New Project"**
3. **Delete the default code** (function myFunction() {})
4. **Copy the entire contents** of `Google_Apps_Script_Code.gs`
5. **Paste it into the script editor**
6. **Find this line** in the script:
   ```javascript
   const CONFIG = {
     SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE', // Replace with actual spreadsheet ID
   ```
7. **Replace `YOUR_SPREADSHEET_ID_HERE`** with your actual spreadsheet ID
8. **Save the project**: Press `Ctrl+S` or click "Save project"

### 4. Deploy as Web App

1. **Click "Deploy"** in the top right
2. **Click "New deployment"**
3. **Click the gear icon** next to "Select type" and choose "Web app"
4. **Configure the deployment**:
   - **Description**: Eco-Pots Registration Backend
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone (important!)
5. **Click "Deploy"**
6. **Authorization**:
   - Click "Authorize access"
   - Choose your Google account
   - You might see "Google hasn't verified this app" - click "Advanced" → "Go to [Your Project Name] (unsafe)"
   - Click "Allow" for all permissions
7. **Copy the Web app URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

### 5. Configure the Web App

1. **Go back to the debug page** (`debug-connection.html`)
2. **Enter your Web app URL** in the first field
3. **Enter your Spreadsheet ID** in the second field
4. **Click "Save Configuration"**
5. **Click "Test Connection"**

## 🧪 Testing the Integration

### Test Connection
- Click the "Test Connection" button
- You should see "Connection Successful" if everything is working

### Test Sample Submission
- Click the "Test Sample Submission" button
- Check your Google Sheet - you should see a new row with test data

## 🚨 Common Issues and Solutions

### Issue: "Google hasn't verified this app"
**Solution**: This is normal for new Apps Script projects. Click "Advanced" → "Go to [Your Project Name] (unsafe)" → "Allow".

### Issue: "Connection Failed" or "Network Error"
**Causes**:
1. Wrong Web app URL
2. Apps Script not deployed properly
3. Firewall blocking the request

**Solutions**:
1. Double-check the Web app URL
2. Redeploy the Apps Script
3. Try a different network

### Issue: "Permission Denied"
**Causes**:
1. Web app deployed with wrong permissions
2. Spreadsheet not properly shared

**Solutions**:
1. Redeploy with "Who has access" = "Anyone"
2. Share the spreadsheet with "Anyone with the link can view"

### Issue: "HTTP error! status: 405"
**Cause**: Apps Script not deployed as web app

**Solution**: Follow Step 4 to deploy as web app properly

### Issue: "HTTP error! status: 404"
**Cause**: Wrong Web app URL

**Solution**: Copy the exact URL from the Apps Script deployment

### Issue: "Request timed out"
**Cause**: Network issues or Apps Script taking too long

**Solution**: Try again or check your internet connection

## 📱 After Setup is Complete

Once the debug page shows successful connection, your main registration form should work correctly. Students can now:

1. Fill out the registration form
2. Click "Submit Registration"
3. See their data automatically appear in your Google Sheet

## 🔍 Debugging Tips

### Check Browser Console
- Press `F12` → "Console" tab
- Look for any error messages
- Common errors: CORS issues, network errors, script errors

### Test with Different Data
- Try submitting with different names, emails, etc.
- Make sure all validation works correctly

### Check Google Apps Script Logs
1. Go to Google Apps Script editor
2. Click "Executions" (clock icon)
3. Look for any failed executions
4. Click on them to see error details

## 📋 Final Checklist

Before going live, verify:

- [ ] Google Spreadsheet created and ID copied
- [ ] Google Apps Script code pasted and spreadsheet ID updated
- [ ] Apps Script deployed as web app with "Anyone" access
- [ ] Web app URL copied correctly
- [ ] Debug page shows successful connection
- [ ] Test submission appears in Google Sheet
- [ ] Form validation works for all fields
- [ ] Email format validation works
- [ ] Phone number format validation works
- [ ] Thank you page displays correctly after submission

## 🆘 Need Help?

If you're still having issues:

1. **Check the debug page** for specific error messages
2. **Look at browser console** for additional errors
3. **Verify your Apps Script deployment** settings
4. **Test with a simple script** first to ensure the connection works

The debug page (`debug-connection.html`) is your best friend for troubleshooting Google Sheets issues!