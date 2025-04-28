// ----------- User Registration -----------
function register() {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const errorElem = document.getElementById('register-error');

    if (!fullname || !phone || !username || !password) {
        errorElem.style.color = "red";
        errorElem.innerText = "Please fill in all fields.";
        return;
    }
    if (!/^\d{10}$/.test(phone)) {
        errorElem.style.color = "red";
        errorElem.innerText = "Please enter a valid 10-digit phone number.";
        return;
    }
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        errorElem.style.color = "red";
        errorElem.innerText = "Username already exists. Please choose another.";
        return;
    }
    users[username] = {
        password: password,
        fullname: fullname,
        phone: phone
    };
    localStorage.setItem('users', JSON.stringify(users));
    errorElem.style.color = "green";
    errorElem.innerText = "Registration successful! Redirecting to login...";
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1200);
}

// ----------- User Login -----------
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElem = document.getElementById('login-error');

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] && users[username].password === password) {
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('username', username);
        window.location.href = 'form.html';
    } else {
        errorElem.style.color = "red";
        errorElem.innerText = "Invalid credentials!";
    }
}

// ----------- Logout -----------
function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// ----------- Assignment Functions -----------

// Assign user to system/subsystem
function submitAssignment() {
    const systemId = document.getElementById('system-select').value;
    const subsystem = document.getElementById('subsystem-select').value;
    const msg = document.getElementById('success-message');
    msg.textContent = "";

    if (!systemId || !subsystem) {
        msg.style.color = "#c0392b";
        msg.innerText = "Please select both system and subsystem!";
        return;
    }

    const username = localStorage.getItem('username');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[username];

    let assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
    // Remove user from previous assignments
    for (const sysId in assignments) {
        for (const sub in assignments[sysId]) {
            assignments[sysId][sub] = assignments[sysId][sub].filter(u => u.username !== username);
        }
    }

    if (!assignments[systemId]) assignments[systemId] = {};
    if (!assignments[systemId][subsystem]) assignments[systemId][subsystem] = [];

    // Prevent duplicate assignment
    if (!assignments[systemId][subsystem].some(u => u.username === username)) {
        assignments[systemId][subsystem].push({
            fullname: user.fullname,
            phone: user.phone,
            username: username
        });
        localStorage.setItem('assignments', JSON.stringify(assignments));
        msg.style.color = "#27ae60";
        msg.innerText = "Assignment successful!";
        setTimeout(() => {
            msg.innerText = "";
            showAssignmentInfo();
        }, 700);
    } else {
        msg.style.color = "#c0392b";
        msg.innerText = "You are already assigned to this subsystem.";
    }
}

// Remove user from their assignment
function leaveAssignment(systemId, subsystem, username) {
    let assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
    if (assignments[systemId] && assignments[systemId][subsystem]) {
        assignments[systemId][subsystem] = assignments[systemId][subsystem].filter(u => u.username !== username);
        localStorage.setItem('assignments', JSON.stringify(assignments));
    }
    const msg = document.getElementById('success-message');
    msg.style.color = "#c0392b";
    msg.innerText = "You have left the subsystem.";
    setTimeout(() => {
        msg.innerText = "";
        showAssignmentInfo();
    }, 1000);
}

// Display the user's current assignment and show "Leave" button
function showAssignmentInfo() {
    const username = localStorage.getItem('username');
    let assignments = JSON.parse(localStorage.getItem('assignments') || '{}');
    let assigned = false;
    let assignedSystem = '', assignedSubsystem = '', assignedSystemId = '';
    // systems array should be defined globally (on form.html)
    for (const sysId in assignments) {
        for (const sub in assignments[sysId]) {
            if (assignments[sysId][sub].some(u => u.username === username)) {
                assigned = true;
                assignedSystemId = sysId;
                assignedSystem = typeof systems !== "undefined" && systems.find(s => s.id == sysId) ? systems.find(s => s.id == sysId).name : sysId;
                assignedSubsystem = sub;
                break;
            }
        }
        if (assigned) break;
    }
    const assignmentDiv = document.getElementById('assignment-info');
    const formSection = document.getElementById('form-section');
    if (assigned) {
        // Hide the assignment form if user is assigned
        if (formSection) formSection.style.display = 'none';
        assignmentDiv.innerHTML = `
            <b>You are assigned to:</b><br>
            System: <b>${assignedSystem}</b><br>
            Subsystem: <b>${assignedSubsystem}</b><br>
            <button id="leave-btn">Leave</button>
        `;
        document.getElementById('leave-btn').onclick = function() {
            leaveAssignment(assignedSystemId, assignedSubsystem, username);
        };
    } else {
        // Show the form if not assigned
        if (formSection) formSection.style.display = '';
        assignmentDiv.innerHTML = '';
    }
}

// ----------- Greeting on Form Page -----------
function greetUser() {
    const username = localStorage.getItem('username');
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[username];
    if (user && document.getElementById('greeting')) {
        document.getElementById('greeting').innerHTML =
            `Welcome, <b>Dr. ${user.fullname}</b><br>Phone: <b>${user.phone}</b>`;
    }
}

// ----------- Page Initialization -----------
function initFormPage() {
    greetUser();
    if (typeof populateSystems === "function") populateSystems();
    showAssignmentInfo();
}
