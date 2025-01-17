<?php
include("backend/session-timeout.php");
include("backend/security-config.php");
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Checkout</title>


    <meta name="viewport" content="width=device-width, initial-scale=1">

    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

   
    <link rel="stylesheet" href="styles/shared/general.css">
    <link rel="stylesheet" href="styles/pages/checkout/checkout-header.css">
    <link rel="stylesheet" href="styles/pages/checkout/checkout.css">
  </head>
  <body>
    <header class="js-checkout-header checkout-header"></header>

    <main>
      <div class="page-title">Review your order</div>

      <section class="row checkout-grid">
        <div class="col-md-8 col-sm-12 js-cart-summary cart-summary"></div>
        <div class="col-md-4 col-sm-12 payment-summary-holder">
        <div class="js-payment-summary payment-summary"></div>
      </div>
      </section>
    </main>

    <script src="https://www.paypal.com/sdk/js?client-id=test&currency=USD&disable-funding=venmo,paylater"></script>

  
    <script type="module" src="scripts/pages/checkout.js"></script>
  
     <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
<script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.7/dist/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@4.3.1/dist/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
  </body>
</html>
