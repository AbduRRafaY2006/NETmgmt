// Global variables
let currentStudent = null;
let backgrounds = [];
let series = [];
let eligibleTests = [];

// Initialize page
window.addEventListener('DOMContentLoaded', () => {
    loadBackgrounds();
    loadSeries();
});

// Tab switching
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

function showDashTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + 'Tab').classList.add('active');
    
    if (tab === 'mytests') {
        loadMyTests();
    }
}

// Load backgrounds
async function loadBackgrounds() {
    try {
        const response = await fetch('/api/student/backgrounds');
        const data = await response.json();
        if (data.success) {
            backgrounds = data.backgrounds;
            const select = document.getElementById('backgroundSelect');
            if (select) {
                select.innerHTML = '<option value="">Select Background</option>' +
                    backgrounds.map(b => `<option value="${b.BackgroundID}">${b.Name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading backgrounds:', error);
    }
}

// Load series
async function loadSeries() {
    try {
        const response = await fetch('/api/student/series');
        const data = await response.json();
        if (data.success) {
            series = data.series;
            populateSeriesSelects();
        }
    } catch (error) {
        console.error('Error loading series:', error);
    }
}

function populateSeriesSelects() {
    const selects = ['seriesSelect', 'applySeriesSelect'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Choose a series</option>' +
                series.map(s => `<option value="${s.SeriesID}">${s.TimeWindow}</option>`).join('');
        }
    });
}

// Student login
async function studentLogin(e) {
    e.preventDefault();
    const cnic = document.getElementById('loginCnic').value;
    
    try {
        const response = await fetch(`/api/student/student/${cnic}`);
        const data = await response.json();
        
        if (data.success) {
            currentStudent = data.student;
            showDashboard();
            showMessage('Login successful!', 'success');
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
}

// Register student
async function registerStudent(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/student/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Registration successful! Please login with your CNIC.', 'success');
            showTab('login');
            form.reset();
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
    }
}

// Show dashboard
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    document.getElementById('studentName').textContent = 
        `${currentStudent.firstName} ${currentStudent.lastName}`;
    document.getElementById('studentIdDisplay').textContent = currentStudent.StudentID;
    document.getElementById('studentCnic').textContent = currentStudent.cnic;
    document.getElementById('studentBackground').textContent = currentStudent.backgroundName;
    
    // Load and display student photo
    loadStudentPhoto();
}

// Load student photo
async function loadStudentPhoto() {
    try {
        const response = await fetch(`/api/student/photo/${currentStudent.StudentID}`);
        if (response.ok) {
            const blob = await response.blob();
            const photoUrl = URL.createObjectURL(blob);
            document.getElementById('studentPhoto').src = photoUrl;
            document.getElementById('studentPhoto').style.display = 'block';
            document.getElementById('noPhoto').style.display = 'none';
        }
    } catch (error) {
        // Photo doesn't exist, show placeholder
        document.getElementById('studentPhoto').style.display = 'none';
        document.getElementById('noPhoto').style.display = 'block';
    }
}

// Preview photo before upload
document.addEventListener('DOMContentLoaded', () => {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Check file size
                if (file.size > 2097152) {
                    showMessage('Photo size must be less than 2MB', 'error');
                    this.value = '';
                    return;
                }
                
                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('photoPreview');
                    preview.innerHTML = `
                        <img src="${e.target.result}" 
                             style="max-width:200px;max-height:200px;border:2px solid #ddd;border-radius:8px;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Upload photo
async function uploadPhoto(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('photoInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Please select a photo', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('studentId', currentStudent.StudentID);
    
    try {
        const response = await fetch('/api/student/upload-photo', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Photo uploaded successfully!', 'success');
            loadStudentPhoto(); // Reload photo
            fileInput.value = '';
            document.getElementById('photoPreview').innerHTML = '';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Photo upload failed. Please try again.', 'error');
    }
}

// Logout
function logout() {
    currentStudent = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
    document.getElementById('loginCnic').value = '';
}

// Enroll in series
async function enrollStudent(e) {
    e.preventDefault();
    const seriesId = document.getElementById('seriesSelect').value;
    
    try {
        const response = await fetch('/api/student/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: currentStudent.StudentID,
                seriesId: seriesId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Enrolled successfully!', 'success');
            document.getElementById('seriesSelect').value = '';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Enrollment failed. Please try again.', 'error');
    }
}

// Load eligible tests
async function loadEligibleTests() {
    const seriesId = document.getElementById('applySeriesSelect').value;
    if (!seriesId) return;
    
    try {
        const response = await fetch(`/api/student/eligible-tests/${currentStudent.BackgroundID}`);
        const data = await response.json();
        
        if (data.success) {
            eligibleTests = data.testTypes;
            const select = document.getElementById('testTypeSelect');
            select.innerHTML = '<option value="">Choose test type</option>' +
                eligibleTests.map(t => `<option value="${t.TestTypeID}">${t.Name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading eligible tests:', error);
    }
}

// Load available durations
async function loadAvailableDurations() {
    const seriesId = document.getElementById('applySeriesSelect').value;
    const testTypeId = document.getElementById('testTypeSelect').value;
    
    if (!seriesId || !testTypeId) return;
    
    try {
        const response = await fetch(`/api/student/durations/${seriesId}/${testTypeId}`);
        const data = await response.json();
        
        console.log('Duration Response:', data); // Debug log
        
        if (data.success) {
            const select = document.getElementById('durationSelect');
            if (data.durations.length === 0) {
                select.innerHTML = '<option value="">No slots available</option>';
                showMessage('No test slots available for this combination. Check if dates are in the future.', 'error');
            } else {
                select.innerHTML = '<option value="">Choose date & time</option>' +
                    data.durations.map(d => 
                        `<option value="${d.DurationID}">
                            ${new Date(d.Date).toLocaleDateString()} - ${d.Type} 
                            ${d.City ? `(${d.City})` : ''}
                        </option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Error loading durations:', error);
        showMessage('Error loading test slots', 'error');
    }
}

// Apply for test
async function applyForTest(e) {
    e.preventDefault();
    
    const durationId = document.getElementById('durationSelect').value;
    const testTypeId = document.getElementById('testTypeSelect').value;
    
    try {
        const response = await fetch('/api/student/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId: currentStudent.StudentID,
                durationId: durationId,
                testTypeId: testTypeId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Application submitted successfully!', 'success');
            document.getElementById('applySeriesSelect').value = '';
            document.getElementById('testTypeSelect').innerHTML = '<option value="">Choose test type</option>';
            document.getElementById('durationSelect').innerHTML = '<option value="">Choose date & time</option>';
        } else {
            showMessage(data.message, 'error');
        }
    } catch (error) {
        showMessage('Application failed. Please try again.', 'error');
    }
}

// Load my tests
async function loadMyTests() {
    try {
        const response = await fetch(`/api/student/my-tests/${currentStudent.StudentID}`);
        const data = await response.json();
        
        const container = document.getElementById('myTestsList');
        
        if (data.success && data.tests.length > 0) {
            container.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Test Type</th>
                            <th>Date</th>
                            <th>Time Slot</th>
                            <th>Series</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.tests.map(t => `
                            <tr>
                                <td>${t.testType}</td>
                                <td>${new Date(t.testDate).toLocaleDateString()}</td>
                                <td>${t.timeSlot}</td>
                                <td>${t.series}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            container.innerHTML = '<p class="no-data">No test applications yet. Apply for a test to get started!</p>';
        }
    } catch (error) {
        console.error('Error loading tests:', error);
    }
}

// Show message
function showMessage(message, type) {
    const box = document.getElementById('messageBox');
    box.textContent = message;
    box.className = 'message-box show ' + type;
    setTimeout(() => box.classList.remove('show'), 3000);
}