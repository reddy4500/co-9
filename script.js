// ----------- Assignment Functions Using Firebase -----------

// Submit assignment
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

    // Get the currently logged-in user
    const user = firebase.auth().currentUser;
    if (!user) {
        msg.style.color = "#c0392b";
        msg.innerText = "You must be logged in to make assignments.";
        return;
    }

    // Fetch user profile from Firestore
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
        msg.style.color = "#c0392b";
        msg.innerText = "User profile not found.";
        return;
    }
    const userProfile = userDoc.data();

    // Remove user from all previous assignments
    const assignmentsRef = firebase.firestore().collection("assignments");
    const allAssignments = await assignmentsRef.get();
    for (const doc of allAssignments.docs) {
        const data = doc.data();
        if (data.users && Array.isArray(data.users)) {
            const userIndex = data.users.findIndex(u => u.username === userProfile.username);
            if (userIndex >= 0) {
                await assignmentsRef.doc(doc.id).update({
                    users: firebase.firestore.FieldValue.arrayRemove(data.users[userIndex])
                });
            }
        }
    }

    // Add user to the new assignment
    const assignmentDocId = `${systemId}_${subsystem}`;
    await assignmentsRef.doc(assignmentDocId).set({
        users: firebase.firestore.FieldValue.arrayUnion({
            fullname: userProfile.fullname,
            phone: userProfile.phone,
            username: userProfile.username
        })
    }, { merge: true });

    msg.style.color = "#27ae60";
    msg.innerText = "Assignment successful!";
    setTimeout(() => {
        msg.innerText = "";
        showAssignmentInfo();
    }, 700);
}

// Leave assignment
async function leaveAssignment(systemId, subsystem, username) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    if (!userDoc.exists) return;
    const userProfile = userDoc.data();

    await firebase.firestore().collection("assignments").doc(`${systemId}_${subsystem}`).update({
        users: firebase.firestore.FieldValue.arrayRemove({
            fullname: userProfile.fullname,
            phone: userProfile.phone,
            username: userProfile.username
        })
    });

    const msg = document.getElementById('success-message');
    msg.style.color = "#c0392b";
    msg.innerText = "You have left the subsystem.";
    setTimeout(() => {
        msg.innerText = "";
        showAssignmentInfo();
    }, 1000);
}

// Show assignment info
async function showAssignmentInfo() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    if (!userDoc.exists) return;
    const userProfile = userDoc.data();

    let assigned = false;
    let assignedSystem = '', assignedSubsystem = '', assignedSystemId = '';

    // Check all assignments for this user
    const assignmentsRef = firebase.firestore().collection("assignments");
    const allAssignments = await assignmentsRef.get();

    for (const doc of allAssignments.docs) {
        const data = doc.data();
        if (data.users && data.users.some(u => u.username === userProfile.username)) {
            const [sysId, sub] = doc.id.split('_');
            assigned = true;
            assignedSystemId = sysId;
            assignedSystem = typeof systems !== "undefined" && systems.find(s => s.id == sysId) ? systems.find(s => s.id == sysId).name : sysId;
            assignedSubsystem = sub;
            break;
        }
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
            leaveAssignment(assignedSystemId, assignedSubsystem, userProfile.username);
        };
    } else {
        // Show the form if not assigned
        if (formSection) formSection.style.display = '';
        assignmentDiv.innerHTML = '';
    }
}

// ----------- Greeting on Form Page (Firebase version) -----------
async function greetUser() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();
    if (userDoc.exists && document.getElementById('greeting')) {
        const userProfile = userDoc.data();
        document.getElementById('greeting').innerHTML =
            `Welcome, <b>Dr. ${userProfile.fullname}</b><br>Phone: <b>${userProfile.phone}</b>`;
    }
}

// ----------- Page Initialization -----------
function initFormPage() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        greetUser();
        if (typeof populateSystems === "function") populateSystems();
        showAssignmentInfo();
    });
}
