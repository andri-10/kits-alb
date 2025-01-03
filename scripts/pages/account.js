document.addEventListener("DOMContentLoaded", function() {
  const resetPasswordForm = document.getElementById('reset-password-form');
  const resetPasswordBtn = document.getElementById('reset-password-btn');
  const showPasswordCheckbox = document.getElementById('show-password');
  const newPasswordField = document.getElementById('new-password');
  const confirmPasswordField = document.getElementById('confirm-password');
  const passwordError = document.getElementById('password-error');

  resetPasswordBtn.addEventListener("click", function(e) {
      e.preventDefault();
      resetPasswordForm.style.display = resetPasswordForm.style.display === "none" ? "block" : "none";
  });

  showPasswordCheckbox.addEventListener("change", function() {
      const type = showPasswordCheckbox.checked ? "text" : "password";
      newPasswordField.type = type;
      confirmPasswordField.type = type;
  });

  resetPasswordForm.addEventListener("submit", function(e) {
      const password = newPasswordField.value;
      const confirmPassword = confirmPasswordField.value;
      const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{8,}$/;

      if (!regex.test(password)) {
          e.preventDefault();
          passwordError.textContent = "Password must be at least 8 characters long, contain a number, and a special character.";
      } else if (password !== confirmPassword) {
          e.preventDefault();
          passwordError.textContent = "Passwords do not match.";
      }
  });
});
