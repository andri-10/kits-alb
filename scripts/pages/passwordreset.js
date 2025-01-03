document.addEventListener("DOMContentLoaded", function () {
  let resendButton = document.getElementById("resend-btn");
  let timerDisplay = document.getElementById("timer");
  let formContainer = document.querySelector("#step2Form");
  let timerText = resendButton.querySelector("span");
  let errorMessageDiv = document.createElement('div'); // To hold error or success messages

  // Ensure the error message div is only appended once
  errorMessageDiv.classList.add('message-container');
  formContainer.appendChild(errorMessageDiv);

  if (timerDisplay) {
    let remainingTime = 5;

    // Disable the resend button initially
    resendButton.disabled = true;
    resendButton.classList.add('disabled'); // Add 'disabled' class to prevent hover color change

    let timer = setInterval(function () {
      remainingTime--;
      timerText.textContent = remainingTime + "s"; // Update the timer inside the button

      if (remainingTime <= 0) {
        clearInterval(timer);
        resendButton.disabled = false; // Enable the button after the timer finishes
        resendButton.classList.remove('disabled'); // Remove 'disabled' class for hover effect
        timerText.textContent = ''; // Remove the timer text
        resendButton.textContent = "Resend"; // Change the button text to "Resend"
      }
    }, 1000);
  }

  if (resendButton) {
    resendButton.addEventListener("click", function () {
      // Make an AJAX request to resend the token
      fetch('backend/resend-token.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'resend' }),
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Display a success message inside the form
          errorMessageDiv.textContent = 'Token resent successfully!';
          errorMessageDiv.classList.add('success-message');
          errorMessageDiv.classList.remove('error-message');

          // Reset the timer and button states
          resendButton.disabled = true;
          resendButton.classList.add('disabled');
          timerText.textContent = "60s"; // Reset the timer display
          resendButton.textContent = "Resend in 60s"; // Reset the button text

          // Restart the timer
          let remainingTime = 60;
          timerText.textContent = remainingTime + 's';
          let timer = setInterval(function () {
            remainingTime--;
            timerText.textContent = remainingTime + "s";
            if (remainingTime <= 0) {
              clearInterval(timer);
              resendButton.disabled = false;
              resendButton.classList.remove('disabled');
              timerText.textContent = '';
              resendButton.textContent = 'Resend';
            }
          }, 1000);
        } else {
          // Display an error message if token resend fails
          errorMessageDiv.textContent = 'Failed to resend the token. Please try again.';
          errorMessageDiv.classList.add('error-message');
          errorMessageDiv.classList.remove('success-message');
        }
      })
      .catch(error => {
        // Handle any fetch errors (network issues, etc.)
        errorMessageDiv.textContent = 'An error occurred. Please try again later.';
        errorMessageDiv.classList.add('error-message');
        errorMessageDiv.classList.remove('success-message');
      });
    });
  }

  // Toggle password visibility functionality
  let togglePassword = document.getElementById('toggle-password');
  let passwordFields = document.querySelectorAll('input[type=password]');
  
  if (togglePassword) {
    togglePassword.addEventListener('change', function () {
      passwordFields.forEach(function (field) {
        field.type = togglePassword.checked ? 'text' : 'password';
      });
    });
  }
});
