document.addEventListener("DOMContentLoaded", function () {
    const footerText = document.querySelector(".kits-footer p");
    const currentYear = new Date().getFullYear();
    footerText.innerHTML = `&copy; ${currentYear} Football Kits Albania. All rights reserved. <br> Follow us on 
      <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>`;
  });
  