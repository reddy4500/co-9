// ----------- Supabase Config -----------
const SUPABASE_URL = "https://kxzkuphsoihlzjwbhghl.supabase.co";
const SUPABASE_APIKEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4emt1cGhzb2lobHpqd2JoZ2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NjcyNTIsImV4cCI6MjA2MTM0MzI1Mn0.6Fa0GLY82aMO19boMFeAfWypeuMflxi90jpOq12s0K8";

// ----------- User Registration -----------
async function register() {
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
    const exists = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}`, {
        headers: { apikey: SUPABASE_APIKEY, Authorization: `Bearer ${SUPABASE_APIKEY}` }
    }).then(res => res.json());

    if (exists.length > 0) {
        errorElem.style.color = "red";
        errorElem.innerText = "Username already exists. Please choose another.";
        return;
    }

    // Create new user
    const { error } = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: "POST",
        headers: {
            apikey: SUPABASE_APIKEY,
            Authorization: `Bearer ${SUPABASE_APIKEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
        },
        body: JSON.stringify({ username, password, fullname, phone })
    }).then(async res => ({ error: res.status >= 400 ? await res.text() : null }));

    if (error) {
        errorElem.style.color = "red";
        errorElem.innerText = "Registration failed: " + error;
        return;
    }

    errorElem.style.color = "green";
    errorElem.innerText = "Registration successful! Redirecting to login...";
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1200);
}

// ----------- User Login -----------
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElem = document.getElementById('login-error');

    const users = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*`, {
        headers: { apikey: SUPABASE_APIKEY, Authorization: `Bearer ${SUPABASE_APIKEY}` }
    }).then(res => res.json());

    if (users.length && users[0].password === password) {
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
async function submitAssignment() {
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
    // Get user info
    const users = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*`, {
        headers: { apikey: SUPABASE_APIKEY, Authorization: `Bearer ${SUPABASE_APIKEY}` }
    }).then(res => res.json());
    const user = users[0];

    // Remove previous assignments for this user
    await fetch(`${SUPABASE_URL}/rest/v1/assignments?username=eq.${encodeURIComponent(username)}`, {
        method: "DELETE",
        headers: {
            apikey: SUPABASE_APIKEY,
            Authorization: `Bearer ${SUPABASE_APIKEY}`
        }
    });

    // Add new assignment
    const { error } = await fetch(`${SUPABASE_URL}/rest/v1/assignments`, {
        method: "POST",
        headers: {
            apikey: SUPABASE_APIKEY,
            Authorization: `Bearer ${SUPABASE_APIKEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
        },
        body: JSON.stringify({
            username,
            system_id: systemId,
            subsystem,
            fullname: user.fullname,
            phone: user.phone
        })
    }).then(async res => ({ error: res.status >= 400 ? await res.text() : null }));

    if (error) {
        msg.style.color = "#c0392b";
        msg.innerText = "Assignment failed: " + error;
        return;
    }

    msg.style.color = "#27ae60";
    msg.innerText = "Assignment successful!";
    setTimeout(() => {
        msg.innerText = "";
        showAssignmentInfo();
    }, 700);
}

// Remove user from their assignment
async function leaveAssignment(systemId, subsystem, username) {
    await fetch(`${SUPABASE_URL}/rest/v1/assignments?username=eq.${encodeURIComponent(username)}&system_id=eq.${systemId}&subsystem=eq.${encodeURIComponent(subsystem)}`, {
        method: "DELETE",
        headers: {
            apikey: SUPABASE_APIKEY,
            Authorization: `Bearer ${SUPABASE_APIKEY}`
        }
    });
    const msg = document.getElementById('success-message');
    msg.style.color = "#c0392b";
    msg.innerText = "You have left the subsystem.";
    setTimeout(() => {
        msg.innerText = "";
        showAssignmentInfo();
    }, 1000);
}

// Display the user's current assignment and show "Leave" button
async function showAssignmentInfo() {
    const username = localStorage.getItem('username');
    const assignments = await fetch(`${SUPABASE_URL}/rest/v1/assignments?username=eq.${encodeURIComponent(username)}&select=*`, {
        headers: { apikey: SUPABASE_APIKEY, Authorization: `Bearer ${SUPABASE_APIKEY}` }
    }).then(res => res.json());

    let assigned = false;
    let assignedSystem = '', assignedSubsystem = '', assignedSystemId = '';
    if (assignments.length) {
        assigned = true;
        assignedSystemId = assignments[0].system_id;
        assignedSystem = typeof systems !== "undefined" && systems.find(s => s.id == assignedSystemId) ? systems.find(s => s.id == assignedSystemId).name : assignedSystemId;
        assignedSubsystem = assignments[0].subsystem;
    }
    const assignmentDiv = document.getElementById('assignment-info');
    if (assigned) {
        if (document.getElementById('form-section')) document.getElementById('form-section').style.display = 'none';
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
        if (document.getElementById('form-section')) document.getElementById('form-section').style.display = '';
        assignmentDiv.innerHTML = '';
    }
}

// ----------- Home Page Credential Display -----------
async function loadHome() {
    const loggedIn = localStorage.getItem('loggedIn');
    const username = localStorage.getItem('username');
    if (!loggedIn || !username) {
        window.location.href = 'login.html';
    } else {
        // Get user info from Supabase
        const users = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*`, {
            headers: { apikey: SUPABASE_APIKEY, Authorization: `Bearer ${SUPABASE_APIKEY}` }
        }).then(res => res.json());
        const user = users[0];
        const fullname = user.fullname || username;
        const phone = user.phone || 'N/A';
        if (document.getElementById('doctor-credentials')) {
            document.getElementById('doctor-credentials').innerText =
                `Logged in as: Dr. ${fullname} | Phone: ${phone}`;
        }
    }
}

// ----------- Greeting on Form Page -----------
async function greetUser() {
    const username = localStorage.getItem('username');
    const users = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=*`, {
        headers: { apikey: SUPABASE_APIKEY, Authorization: `Bearer ${SUPABASE_APIKEY}` }
    }).then(res => res.json());
    const user = users[0];
    if (user && document.getElementById('greeting')) {
        document.getElementById('greeting').innerHTML =
            `Welcome, <b>${user.fullname}</b><br>Phone: <b>${user.phone}</b>`;
    }
}

// ----------- Page Initialization -----------
async function initFormPage() {
    await greetUser();
    if (typeof populateSystems === "function") populateSystems();
    await showAssignmentInfo();
}

// Call loadHome() on index.html
if (document.getElementById('doctor-credentials')) {
    loadHome();
}
