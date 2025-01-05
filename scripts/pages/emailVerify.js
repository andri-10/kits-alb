document.addEventListener("DOMContentLoaded", function () {
    // Resend token timer functionality
    let resendButton = document.getElementById("resend-btn");
    let timerDisplay = document.getElementById("timer");
    let formContainer = document.querySelector("#step2Form");
    let timerText = resendButton?.querySelector("span");
    let errorMessageDiv = document.createElement('div'); // To hold error or success messages
    
    // Ensure the error message div is only appended once
    errorMessageDiv.classList.add('message-container');
    if (formContainer) formContainer.appendChild(errorMessageDiv);
  
    if (timerDisplay) {
      let remainingTime = 10;
  
      // Disable the resend button initially
      resendButton.disabled = true;
      resendButton.classList.add('disabled'); // Add 'disabled' class to prevent hover color change
  
      let timer = setInterval(function () {
        remainingTime--;
        if (timerText) timerText.textContent = remainingTime + "s"; // Update the timer inside the button
  
        if (remainingTime <= 0) {
          clearInterval(timer);
          resendButton.disabled = false; // Enable the button after the timer finishes
          resendButton.classList.remove('disabled'); // Remove 'disabled' class for hover effect
          if (timerText) timerText.textContent = ''; // Remove the timer text
          resendButton.textContent = "Resend"; // Change the button text to "Resend"
          resendButton.style.backgroundColor='rgb(19, 25, 33)';
  
           // Hover effect (ensure it's still applied despite inline styles)
    if (resendButton) {
      resendButton.addEventListener("mouseenter", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(233, 144, 11)';  // Darker shade on hover
        }
      });
  
      resendButton.addEventListener("mouseleave", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(19, 25, 33)';  // Original background color
        }
      });
    }
        }
      }, 1000);
    }
  
    if (resendButton) {
      resendButton.addEventListener("click", function () {
        // Disable the button immediately after clicking
        resendButton.disabled = true;
        resendButton.classList.add('disabled');
        resendButton.textContent = "Resending..."; // Change the text to "Resending..."
  
        // Make an AJAX request to resend the token
        fetch('backend/resend-token.php', {
          method: 'POST',
          body: JSON.stringify({ action: 'resend' }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              // Display a success message inside the form
              smallErrorMessage=document.getElementById("phpError2");
              smallSuccessMessage=document.getElementById("phpSuccess2");
              errorMessageDiv.textContent = 'Token resent successfully!';
              errorMessageDiv.classList.add('success-message-box');
              errorMessageDiv.classList.remove('error-message-box');
              if(smallErrorMessage) smallErrorMessage.textContent="";
              if(smallSuccessMessage) smallSuccessMessage.textContent="";
              errorMessageDiv.classList.remove('fade-out');
              setTimeout(function() {
                errorMessageDiv.classList.add('fade-out');
              }, 2000);
             
              setTimeout(function() {
                errorMessageDiv.textContent = ''; // Clear the message
                
                
              }, 3000); 
  
  
              // Reset the timer and button states
              resendButton.disabled = true;
              resendButton.classList.add('disabled');
              resendButton.innerHTML = `Resend Code in <span id="timer">10s</span>`; // Reset the button text
              timerText = resendButton?.querySelector("span");
              resendButton.style.backgroundColor='rgb(86, 99, 116)';
              
              if (resendButton) {
                resendButton.addEventListener("mouseenter", function () {
                  if (resendButton.disabled) {
                    resendButton.style.backgroundColor = 'rgb(233, 144, 11)';  // Darker shade on hover
                  }
                });
            
                resendButton.addEventListener("mouseleave", function () {
                  if (resendButton.disabled) {
                    resendButton.style.backgroundColor = 'rgb(86, 99, 116)';  // Original background color
                  }
                });
              }
              // Restart the timer
              let remainingTime = 10;
              let timer = setInterval(function () {
                remainingTime--;
                if (timerText) timerText.textContent = remainingTime + "s"; // Update the timer inside the button
          
                if (remainingTime <= 0) {
                  clearInterval(timer);
                  resendButton.disabled = false; // Enable the button after the timer finishes
                  resendButton.classList.remove('disabled'); // Remove 'disabled' class for hover effect
                  if (timerText) timerText.textContent = ''; // Remove the timer text
                  resendButton.textContent = "Resend"; // Change the button text to "Resend"
                  resendButton.style.backgroundColor='rgb(19, 25, 33)';
  
           // Hover effect (ensure it's still applied despite inline styles)
    if (resendButton) {
      resendButton.addEventListener("mouseenter", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(233, 144, 11)';  // Darker shade on hover
        }
      });
  
      resendButton.addEventListener("mouseleave", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(19, 25, 33)';  // Original background color
        }
      });
    }
                }
              }, 1000);
            } else {
              // Display an error message if token resend fails
              smallErrorMessage=document.getElementById("phpError2");
              smallSuccessMessage=document.getElementById("phpSuccess2");
              errorMessageDiv.textContent = 'Failed to resend the token. Please try again.';
              errorMessageDiv.classList.add('error-message-box');
              errorMessageDiv.classList.remove('fade-out');
              errorMessageDiv.classList.remove('success-message-box');
              if(smallErrorMessage) smallErrorMessage.textContent="";
              if(smallSuccessMessage) smallSuccessMessage.textContent="";
  
              // Fade out the error message after 2 seconds
            setTimeout(function() {
              errorMessageDiv.classList.add('fade-out');
            }, 2000);
            // Remove the message after fade-out completes (1 second)
            setTimeout(function() {
              errorMessageDiv.textContent = ''; // Clear the message
              
            }, 3000); // 1s fade + 2s delay
            }
          })
          .catch(() => {
            // Handle any fetch errors (network issues, etc.)
            smallErrorMessage=document.getElementById("phpError2");
            smallSuccessMessage=document.getElementById("phpSuccess2");
            errorMessageDiv.textContent = 'An error occurred. Please try again later.';
            errorMessageDiv.classList.add('error-message-box');
            errorMessageDiv.classList.remove('success-message-box');
            errorMessageDiv.classList.remove('fade-out');
            if(smallErrorMessage) smallErrorMessage.textContent="";
            if(smallSuccessMessage) smallSuccessMessage.textContent="";
  
            // Fade out the error message after 2 seconds
            setTimeout(function() {
              errorMessageDiv.classList.add('fade-out');
            }, 2000);
            // Remove the message after fade-out completes (1 second)
            setTimeout(function() {
              errorMessageDiv.textContent = ''; // Clear the message
            
            }, 3000); // 1s fade + 2s delay
          });
      });
    }
  
  });