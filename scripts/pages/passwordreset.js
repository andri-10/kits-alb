document.addEventListener("DOMContentLoaded", function() {
  const showPasswordCheckbox = document.getElementById('show-password');
  const passwordFields = document.querySelectorAll('input[type="password"]');

  // Toggle password visibility
  showPasswordCheckbox.addEventListener('change', function() {
      passwordFields.forEach(function(field) {
          field.type = field.type === 'password' ? 'text' : 'password';
      });
  });

  // Ensure token field only accepts digits
  const tokenField = document.getElementById('token');
  tokenField.addEventListener('input', function(event) {
      event.target.value = event.target.value.replace(/\D/g, '');
  });
});
