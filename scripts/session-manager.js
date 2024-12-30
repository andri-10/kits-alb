
// Function to check session status
function checkSession() {
    fetch('backend/session-timeout.php?check_session=1')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'timeout') {
                window.location.replace('login.php');
            }
        })
        .catch(error => console.error('Session check failed:', error));
}

// Start checking immediately
checkSession();

// Check every 5 seconds
const sessionChecker = setInterval(checkSession, 5000);

// Add event listeners for user activity
['mousemove', 'keypress', 'click', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
        fetch('backend/session-timeout.php')
            .catch(error => console.error('Error updating session:', error));
    });
});

// Ensure session is checked when tab becomes visible again
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkSession();
    }
});