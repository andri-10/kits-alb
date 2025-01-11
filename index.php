<?php
include("backend/session-timeout.php");
$isLoggedIn = isset($_SESSION['user_id']);
include("backend/security-config.php");
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Kits Albania</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

   
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/index.css">
  </head>
  <body>
    <div class="wrapper">
      
      <header class="kits-header">
        <section class="left-section">
            <a href="index.php" class="header-link">
                <img class="kits-logo" src="images/kits-logo-white.png" alt="Kits Alb Logo">
                <img class="kits-mobile-logo" src="images/kits-mobile-logo-white.png" alt="Kits Alb Mobile Logo">
            </a>
        </section>
      
        <div class="kits-header-right-section">
          
        <a href="catalog.php" class="header-link">Catalog</a>
        <?php if ($isLoggedIn): ?>
          <?php if ($_SESSION['user_role']==="admin"): ?>    
            <a href="admin.php" class="header-link">Admin</a>
            <?php endif; ?>
          <a href="account.php" class="header-link">Account</a>
          <?php endif; ?>
          
          <a href="contact.php" class="header-link">Contact Us</a>
          
          
          <?php if ($isLoggedIn): ?>
            
            <a href="logout.php" class="header-link">Sign Out</a>
            
          <?php else: ?>
            
            <a href="login.php" class="header-link">Sign In</a>
          <?php endif; ?>
        </div>

        <section class="right-section-mobile">
            <img class="js-hamburger-menu-toggle hamburger-menu-toggle" src="images/icons/hamburger-menu.png" data-testid="hamburger-menu-toggle">
        </section>

        <div class="js-hamburger-menu-dropdown hamburger-menu-dropdown" data-testid="hamburger-menu-dropdown">
          <?php if ($isLoggedIn): ?>
            <a class="hamburger-menu-link" href="logout.php">Sign Out</a>
            <a class="hamburger-menu-link" href="account.php">Account</a>
          <?php else: ?>
            <a class="hamburger-menu-link" href="login.php">Sign In</a>
          <?php endif; ?>
          <a class="hamburger-menu-link" href="contact.php">Contact Us</a>
          <a class="hamburger-menu-link" href="catalog.php">Catalog</a>
        </div>    

      </header>

      <div class="content">
        <div class="carousel-container">
          <div class="carousel">
            <div class="carousel-content">
              <p class="quote">Grab your favourite Jersey!</p>
              <button class="shop-now-btn" onclick="window.location.href='catalog.php'">Shop Now</button>
            </div>
          </div>
        </div>
      </div>

     
      <footer class="kits-footer">
        <p>&copy; 2024 Football Kits Albania. All rights reserved. <br> Follow us on 
          <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
        </p>
      </footer>
    </div>

    <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
    <?php endif; ?>

    <script>
      document.addEventListener("DOMContentLoaded", function () {
        const menuToggle = document.querySelector(".hamburger-menu-toggle");
        const menuDropdown = document.querySelector(".hamburger-menu-dropdown");

        menuToggle.addEventListener("click", function () {
          menuDropdown.classList.toggle("hamburger-menu-opened");
        });
      });
    </script>
    <script src="scripts/components/shared/KitsFooter.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
  </body>
</html>
  </body>
</html>
