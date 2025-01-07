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
checkSession();
const sessionChecker = setInterval(checkSession, 5000);
['mousemove', 'keypress', 'click', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
        fetch('backend/session-timeout.php')
            .catch(error => console.error('Error updating session:', error));
    });
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkSession();
    }
});