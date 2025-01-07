<?php
include("backend/session-timeout.php");
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Checkout</title>


    <meta name="viewport" content="width=device-width, initial-scale=1">

    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

   
    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/pages/checkout/checkout-header.css">
    <link rel="stylesheet" href="styles/pages/checkout/checkout.css">
  </head>
  <body>
    <header class="js-checkout-header checkout-header"></header>

    <main>
      <div class="page-title">Review your order</div>

      <section class="checkout-grid">
        <div class="js-cart-summary cart-summary"></div>
        <div class="js-payment-summary payment-summary"></div>
      </section>
    </main>

    <script src="https://www.paypal.com/sdk/js?client-id=test&currency=USD&disable-funding=venmo,paylater"></script>

  
    <script type="module" src="scripts/pages/checkout.js"></script>
     
     <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
  </body>
</html>
