<?php
include("backend/session-timeout.php");
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Catalog</title>


    <meta name="viewport" content="width=device-width, initial-scale=1">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

 
    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/catalog.css">
  </head>
  <body>
    <header class="js-kits-header kits-header"></header>

    <main>
      <div class="js-products-grid products-grid"></div>
    </main>

  
    <script type="module" src="scripts/pages/catalog.js"></script>
    
     <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
  </body>
</html>
