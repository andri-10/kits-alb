<?php
include("backend/session-timeout.php");

// Check if the user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
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

    <!-- CSS Files -->
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/index.css">
  </head>
  <body>
    <div class="wrapper">
      <!-- Header -->
      <header class="kits-header">
        <section class="left-section">
            <a href="index.php" class="header-link">
                <img class="kits-logo" src="images/kits-logo-white.png" alt="Kits Alb Logo">
                <img class="kits-mobile-logo" src="images/kits-mobile-logo-white.png" alt="Kits Alb Mobile Logo">
            </a>
        </section>
      
        <div class="kits-header-right-section">
          <?php if ($isLoggedIn): ?>
            <!-- If logged in, show the logout button -->
            <a href="logout.php" class="header-link">Log Out</a>
            <a href="account.php" class="header-link">Account</a>
          <?php else: ?>
            <!-- If not logged in, show the login button -->
            <a href="login.php" class="header-link">Log In</a>
          <?php endif; ?>
          <a href="contact.php" class="header-link">Contact Us</a>
          <a href="catalog.php" class="header-link">Catalog</a>
        </div>
      </header>

      <!-- Main Content -->
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

      <!-- Footer -->
      <footer class="kits-footer">
        <p>&copy; 2024 Football Kits Albania. All rights reserved. <br> Follow us on 
          <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
        </p>
      </footer>
    </div>

    <!-- Session Timeout Script - Only add if user is logged in -->
    <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
  </body>
</html>