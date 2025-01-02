document.addEventListener("DOMContentLoaded", function () {
  let resendButton = document.getElementById("resend-btn");
  let timerDisplay = document.getElementById("timer");

  if (timerDisplay) {
    let remainingTime = 60;
    let timer = setInterval(function () {
      remainingTime--;
      timerDisplay.textContent = remainingTime + "s";
      if (remainingTime <= 0) {
        clearInterval(timer);
        resendButton.style.display = 'block';
        timerDisplay.textContent = '';
      }
    }, 1000);
  }

  if (resendButton) {
    resendButton.addEventListener("click", function () {
      // Handle token resend logic here
      alert("Token resent!");
    });
  }

  // Toggle password visibility
  let togglePassword = document.getElementById('toggle-password');
  let passwordFields = document.querySelectorAll('input[type=password]');
  togglePassword.addEventListener('change', function () {
    passwordFields.forEach(function (field) {
      field.type = togglePassword.checked ? 'text' : 'password';
    });
  });
});
