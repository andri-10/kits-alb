<?php
session_start();
require __DIR__ . '/backend/utils.php';
include("backend/security-config.php");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$error = '';
$success = '';
$step = 1;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['submit'])) {
        $first_name = filter_var($_POST['FirstName'], FILTER_SANITIZE_STRING);
        $last_name = filter_var($_POST['LastName'], FILTER_SANITIZE_STRING);
        $email = filter_var($_POST['Email'], FILTER_SANITIZE_EMAIL);
        $message = filter_var($_POST['Message'], FILTER_SANITIZE_STRING);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Invalid email format.";
        } else {
            $ticket_number = strtoupper(uniqid("Ticket#", true));
            $support_email = "kits.albania@gmail.com";
            $subject = "Ticket: $ticket_number from $first_name $last_name";
            $body = "
                Name: $first_name
                Surname: $last_name
                Email: $email
                Message: $message
            ";

            if (sendEmail($support_email, $subject, $body)) {
                $user_subject = "Ticket Confirmation: $ticket_number";
                $user_body = "Dear $first_name $last_name,

Thank you for reaching out to us. 
Your message has been received, and a ticket has been created with the number: 

$ticket_number.

Please expect a response within the next few days.

Best regards,
The Kits Alb Support Team
                ";

                if (sendEmail($email, $user_subject, $user_body)) {
                    $success = "Your message has been sent. Please check your email for confirmation!";
                    $step = 2;
                } else {
                    $error = "Failed to send confirmation email.";
                }
            } else {
                $error = "Failed to send ticket email to support.";
            }
        }
    }
}

$conn->close();
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
    <?php if (!$success): ?>
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

    <?php if ($success): ?>
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

  </div>
</div>

<footer class="kits-footer">
  <p>&copy; 2024 Football Kits Albania <br> Follow us on 
    <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
  </p>
</footer>
<script src="scripts/components/shared/KitsFooter.js"></script>
</body>
</html>
