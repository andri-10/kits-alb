<?php
include("backend/session-timeout.php");

// Check if the user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
?>

<!DOCTYPE html>
<html>
  <head>
    <title>Checkout</title>

    <!-- This code is needed for responsive design to work properly on a phone.
      (Responsive design = make the website look good on smaller screen sizes). -->
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Load the font Roboto from Google Fonts. -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

    <!-- Our custom CSS for this page. -->
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

    <!-- PayPal's JavaScript code. Due to financial regulations,
      we must load this code using a <script> tag. -->
    <script src="https://www.paypal.com/sdk/js?client-id=test&currency=USD&disable-funding=venmo,paylater"></script>

    <!-- Our custom JavaScript for this page. -->
    <script type="module" src="scripts/pages/checkout.js"></script>
     <!-- Session Timeout Script - Only add if user is logged in -->
     <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
  </body>
</html>
