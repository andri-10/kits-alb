<?php
include("backend/session-timeout.php");
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Orders</title>

    
    <meta name="viewport" content="width=device-width, initial-scale=1">

    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

  
    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/pages/orders.css">
  </head>
  <body>
    <header class="js-kits-header kits-header"></header>

    <main>
      <div class="page-title">Your Orders</div>
      <div class="js-orders-grid orders-grid"></div>
    </main>

    
    <script type="module" src="scripts/pages/orders.js"></script>
     
     <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
  </body>
  
</html>
