// Initialize Firebase
const firebaseConfig = {
    // Your Firebase configuration goes here
    // You need to replace these with your own
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Helper functions to interact with Firebase

// -----------------------------------------------------
// -------------------Firebase Functions---------------
// -----------------------------------------------------

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
     // Check if username exists
     database.ref('users/' + username).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            errorElem.style.color = "red";
            errorElem.innerText = "Username already exists. Please choose another.";
        } else {
            // Add new user
            database.ref('users/' + username).set({ fullname, phone, password });
            errorElem.style.color = "green";
            errorElem.innerText = "Registration successful! Redirecting to login...";
            setTimeout(() => window.location.href = 'login.html', 1200);
        }
    });
}

// ----------- User Login -----------
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElem = document.getElementById('login-error');

    // Check if username exists
    database.ref('users/' + username).once('value').then((snapshot) => {
        const user = snapshot.val();
        if (user && user.password === password) {
            // Store logged in status and username in session storage
            sessionStorage.setItem('loggedIn', 'true');
            sessionStorage.setItem('username', username);
            window.location.href = 'form.html';
        } else {
            errorElem.style.color = "red";
            errorElem.innerText = "Invalid credentials!";
        }
    });
}

// ----------- Logout -----------
function logout() {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('username');
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
    const username = sessionStorage.getItem('username');

     // Get user data
     database.ref('users/' + username).once('value').then((userSnapshot) => {
        const user = userSnapshot.val();
        if (!user) {
            msg.style.color = "#c0392b";
            msg.innerText = "User data not found!";
            return;
        }

        // Remove user from previous assignments
        database.ref('assignments').once('value').then((assignmentsSnapshot) => {
            const assignments = assignmentsSnapshot.val() || {};
            for (const sysId in assignments) {
                for (const sub in assignments[sysId]) {
                    assignments[sysId][sub] = assignments[sysId][sub].filter(u => u.username !== username);
                }
            }

            // Update assignments in Firebase
            database.ref('assignments').set(assignments).then(() => {
                // Add new assignment
                if (!assignments[systemId]) assignments[systemId] = {};
                if (!assignments[systemId][subsystem]) assignments[systemId][subsystem] = [];
                if (!assignments[systemId][subsystem].some(u => u.username === username)) {
                    assignments[systemId][subsystem].push({
                        fullname: user.fullname,
                        phone: user.phone,
                        username: username
                    });
                    database.ref('assignments').set(assignments).then(() => {
                        msg.style.color = "#27ae60";
                        msg.innerText = "Assignment successful!";
                        setTimeout(() => {
                            msg.innerText = "";
                            showAssignmentInfo();
                        }, 700);
                    });
                } else {
                    msg.style.color = "#c0392b";
                    msg.innerText = "You are already assigned to this subsystem.";
                }
            });
        });
    });
}


//remove user from their assignment
function leaveAssignment(systemId, subsystem, username) {
    database.ref('assignments/' + systemId + '/' + subsystem).orderByChild('username').equalTo(username).once('value', snapshot => {
        snapshot.forEach(child => child.ref.remove());
    }).then(() => {
        // Re-display assignment info after leaving
        showAssignmentInfo();
    });
}

// Display the user's current assignment and show "Leave" button
function showAssignmentInfo() {
    const username = sessionStorage.getItem('username');
    const assignmentDiv = document.getElementById('assignment-info');
    const formSection = document.getElementById('form-section');

    database.ref('assignments').once('value').then(assignmentsSnapshot => {
        const assignments = assignmentsSnapshot.val() || {};
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
    });
}   

// ----------- Greeting on Form Page -----------
function greetUser() {   
     const username = sessionStorage.getItem('username');
     database.ref('users/' + username).once('value').then(userSnapshot => {
        const user = userSnapshot.val();
        if (user && document.getElementById('greeting')) {
            document.getElementById('greeting').innerHTML =
                `Welcome, <b>Dr. ${user.fullname}</b><br>Phone: <b>${user.phone}</b>`;
        }
    });
}


// ----------- Page Initialization -----------
function initFormPage() {
    greetUser();
    if (typeof populateSystems === "function") populateSystems();
    showAssignmentInfo();
}
