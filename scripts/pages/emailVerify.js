document.addEventListener("DOMContentLoaded", function () {
    let resendButton = document.getElementById("resend-btn");
    let timerDisplay = document.getElementById("timer");
    let formContainer = document.querySelector("#step2Form");
    let timerText = resendButton?.querySelector("span");
    let errorMessageDiv = document.createElement('div');
    errorMessageDiv.classList.add('message-container');
    if (formContainer) formContainer.appendChild(errorMessageDiv);
  
    if (timerDisplay) {
      let remainingTime = 10;
      resendButton.disabled = true;
      resendButton.classList.add('disabled');
  
      let timer = setInterval(function () {
        remainingTime--;
        if (timerText) timerText.textContent = remainingTime + "s";
  
        if (remainingTime <= 0) {
          clearInterval(timer);
          resendButton.disabled = false;
          resendButton.classList.remove('disabled');
          if (timerText) timerText.textContent = '';
          resendButton.textContent = "Resend";
          resendButton.style.backgroundColor='rgb(19, 25, 33)';
    if (resendButton) {
      resendButton.addEventListener("mouseenter", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(233, 144, 11)';
        }
      });
  
      resendButton.addEventListener("mouseleave", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(19, 25, 33)';
        }
      });
    }
        }
      }, 1000);
    }
  
    if (resendButton) {
      resendButton.addEventListener("click", function () {
        resendButton.disabled = true;
        resendButton.classList.add('disabled');
        resendButton.textContent = "Resending...";
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
                errorMessageDiv.textContent = '';
                
                
              }, 3000); 
              resendButton.disabled = true;
              resendButton.classList.add('disabled');
              resendButton.innerHTML = `Resend Code in <span id="timer">10s</span>`;
              timerText = resendButton?.querySelector("span");
              resendButton.style.backgroundColor='rgb(86, 99, 116)';
              
              if (resendButton) {
                resendButton.addEventListener("mouseenter", function () {
                  if (resendButton.disabled) {
                    resendButton.style.backgroundColor = 'rgb(233, 144, 11)';
                  }
                });
            
                resendButton.addEventListener("mouseleave", function () {
                  if (resendButton.disabled) {
                    resendButton.style.backgroundColor = 'rgb(86, 99, 116)';
                  }
                });
              }
              let remainingTime = 10;
              let timer = setInterval(function () {
                remainingTime--;
                if (timerText) timerText.textContent = remainingTime + "s";
          
                if (remainingTime <= 0) {
                  clearInterval(timer);
                  resendButton.disabled = false;
                  resendButton.classList.remove('disabled');
                  if (timerText) timerText.textContent = '';
                  resendButton.textContent = "Resend";
                  resendButton.style.backgroundColor='rgb(19, 25, 33)';
    if (resendButton) {
      resendButton.addEventListener("mouseenter", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(233, 144, 11)';
        }
      });
  
      resendButton.addEventListener("mouseleave", function () {
        if (!resendButton.disabled) {
          resendButton.style.backgroundColor = 'rgb(19, 25, 33)';
        }
      });
    }
                }
              }, 1000);
            } else {
              smallErrorMessage=document.getElementById("phpError2");
              smallSuccessMessage=document.getElementById("phpSuccess2");
              errorMessageDiv.textContent = 'Failed to resend the token. Please try again.';
              errorMessageDiv.classList.add('error-message-box');
              errorMessageDiv.classList.remove('fade-out');
              errorMessageDiv.classList.remove('success-message-box');
              if(smallErrorMessage) smallErrorMessage.textContent="";
              if(smallSuccessMessage) smallSuccessMessage.textContent="";
            setTimeout(function() {
              errorMessageDiv.classList.add('fade-out');
            }, 2000);
            setTimeout(function() {
              errorMessageDiv.textContent = '';
              
            }, 3000);
            }
          })
          .catch(() => {
            smallErrorMessage=document.getElementById("phpError2");
            smallSuccessMessage=document.getElementById("phpSuccess2");
            errorMessageDiv.textContent = 'An error occurred. Please try again later.';
            errorMessageDiv.classList.add('error-message-box');
            errorMessageDiv.classList.remove('success-message-box');
            errorMessageDiv.classList.remove('fade-out');
            if(smallErrorMessage) smallErrorMessage.textContent="";
            if(smallSuccessMessage) smallSuccessMessage.textContent="";
            setTimeout(function() {
              errorMessageDiv.classList.add('fade-out');
            }, 2000);
            setTimeout(function() {
              errorMessageDiv.textContent = '';
            
            }, 3000);
          });
      });
    }
  
  });