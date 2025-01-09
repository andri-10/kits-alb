<?php
session_start();
include("backend/security-config.php");
?>
<!DOCTYPE html>
<html>
  <head>
    <title>Tracking</title>

    
    <meta name="viewport" content="width=device-width, initial-scale=1">

   
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/tracking.css">
  </head>
  <body>
    <header class="js-kits-header kits-header"></header>

    <main>
      <div class="js-order-tracking order-tracking"></div>
    </main>

    <!-- Our custom JavaScript for this page. -->
    <script type="module" src="scripts/pages/tracking.js"></script>
  </body>
</html>
