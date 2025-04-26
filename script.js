const doctors = { "doctor1": "pass123", "doctor2": "pass456" };

// Login Function
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (doctors[username] && doctors[username] === password) {
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('username', username);
        window.location.href = 'form.html'; // Go to details form after login
    } else {
        document.getElementById('login-error').innerText = "Invalid credentials!";
    }
}

// Submit Details Function
function submitDetails() {
    const college = document.getElementById('college').value;
    const batch = document.getElementById('batch').value;
    const name = document.getElementById('name').value.trim();
    if (college && batch && name) {
        localStorage.setItem('college', college);
        localStorage.setItem('batch', batch);
        localStorage.setItem('name', name);
        window.location.href = 'index.html'; // Redirect to home page
    } else {
        alert("Please fill all fields!");
    }
}

// Load Home Page with Credentials
function loadHome() {
    const loggedIn = localStorage.getItem('loggedIn');
    const name = localStorage.getItem('name');
    const batch = localStorage.getItem('batch');
    if (!loggedIn || !name || !batch) {
        window.location.href = 'login.html';
    } else {
        document.getElementById('doctor-credentials').innerText =
            `Logged in as: Dr. ${name} (Batch: ${batch})`;
    }
}

// Call loadHome() on index.html
if (document.getElementById('doctor-credentials')) {
    loadHome();
}
