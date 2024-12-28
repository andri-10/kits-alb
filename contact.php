<?php
$form_submitted = isset($_POST['submit']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Us</title>
  <link rel="stylesheet" href="styles/pages/contact.css">
  <link rel="stylesheet" href="styles/shared/kits-header.css">
  <link rel="stylesheet" href="styles/shared/kits-footer.css">
  
</head>
<body>
<header class="kits-header">
  <section class="left-section">
    <a href="index.php" class="header-link">
      <img class="kits-logo" src="images/kits-logo-white.png" alt="Kits Alb Logo">
      <img class="kits-mobile-logo" src="images/kits-mobile-logo-white.png" alt="Kits Alb Mobile Logo">
    </a>
  </section>
</header>

<div class="new_home_web">
  <div class="responsive-container-block big-container">
    <?php if (!$form_submitted): ?>
      <div class="responsive-container-block textContainer">
        <div class="topHead">
          <p class="text-blk heading">Get in <span class="yellowText">touch</span></p>
          <div class="yellowLine" id="w-c-s-bgc_p-2-dm-id"></div>
        </div>
        <p class="text-blk subHeading">
          Have questions or feedback? We’d love to hear from you!
        </p>
      </div>
      <div class="responsive-container-block container">
        <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-7 wk-ipadp-10 line" id="i69b">
          <form method="POST" class="form-box">
            <div class="container-block form-wrapper">
              <div class="responsive-container-block">
                <div class="left4">
                  <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                    <input class="input" name="FirstName" placeholder="First Name" required>
                  </div>
                  <div class="responsive-cell-block wk-desk-6 wk-ipadp-6 wk-tab-12 wk-mobile-12">
                    <input class="input" name="LastName" placeholder="Last Name" required>
                  </div>
                  <div class="responsive-cell-block wk-desk-6 wk-ipadp-6 wk-tab-12 wk-mobile-12">
                    <input class="input" name="Email" type="email" placeholder="Email Address" required>
                  </div>
                </div>
                <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-12 wk-ipadp-12">
                  <textarea class="textinput" name="Message" placeholder="Message" required></textarea>
                </div>
              </div>
              <input type="submit" name="submit" class="send">
            </div>
          </form>
        </div>
      </div>
    <?php endif; ?>
  </div>
</div>

<?php if ($form_submitted): ?>

  <div class="popup-modal" style="display: flex;">
    <div class="popup-content">
      <div class="popup-header">Thank You!</div>
      <p class="popup-message">
        Your message has been submitted. Please check your email for our response!
      </p>
      <div class="popup-divider"></div>
      <div class="button-container">

        <a href="catalog.php" class="popup-button shop-button">Shop Now</a>

        <a href="contact.php" class="popup-button return-button">Return</a>
      </div>
    </div>
  </div>
<?php endif; ?>

<footer class="kits-footer">
  <p>&copy; 2024 Football Kits Albania <br> Follow us on 
    <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
  </p>
</footer>

</body>
</html>
