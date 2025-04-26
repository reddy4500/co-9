// Register Function
function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const errorElem = document.getElementById('register-error');

    if (!username || !password) {
        errorElem.innerText = "Please enter both username and password.";
        return;
    }

    // Get users from localStorage or create new object
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        errorElem.innerText = "Username already exists. Please choose another.";
        return;
    }

    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
    errorElem.style.color = "green";
    errorElem.innerText = "Registration successful! Redirecting to login...";
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1200);
}

// Login Function
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElem = document.getElementById('login-error');

    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username] && users[username] === password) {
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('username', username);
        window.location.href = 'form.html'; // Go to details form after login
    } else {
        errorElem.innerText = "Invalid credentials!";
    }
}

// Submit Details Function (unchanged)
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

// Load Home Page with Credentials (unchanged)
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
