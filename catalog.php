<?php
include("backend/session-timeout.php");
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Catalog</title>

    <!-- This code is needed for responsive design to work properly on a phone.
      (Responsive design = make the website look good on smaller screen sizes). -->
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Load the font Roboto from Google Fonts. -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

    <!-- Our custom CSS for this page. -->
    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/catalog.css">
  </head>
  <body>
    <header class="js-kits-header kits-header"></header>

    <main>
      <div class="js-products-grid products-grid"></div>
    </main>

    <!-- Our custom JavaScript for this page. -->
    <script type="module" src="scripts/pages/catalog.js"></script>
     <!-- Session Timeout Script - Only add if user is logged in -->
     <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
  </body>
</html>
