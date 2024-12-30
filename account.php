<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account - Kits Alb</title>
    <link rel="stylesheet" href="styles/pages/account.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
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

    <main class="account-page">
        <section class="account-container">
            <h1>My Account</h1>
            <form action="#" method="POST" enctype="multipart/form-data" class="account-form">
                <div class="profile-section">
                    <img src="images/profile-placeholder.png" alt="Profile Picture" class="profile-picture">
                    <label for="profile_picture" class="change-picture-label">Change Profile Picture:</label>
                    <input type="file" name="profile_picture" id="profile_picture" accept="image/*">
                </div>
                <div class="info-section">
                    <label for="first_name">First Name:</label>
                    <input type="text" id="first_name" name="first_name" placeholder="Enter your first name" required>

                    <label for="last_name">Last Name:</label>
                    <input type="text" id="last_name" name="last_name" placeholder="Enter your last name" required>

                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" placeholder="Enter your email" required>

                    <label for="password">Reset Password:</label>
                    <input type="password" id="password" name="password" placeholder="Enter new password">
                </div>
                <button type="submit" class="save-button">Save Changes</button>
            </form>
        </section>
    </main>

    <footer class="kits-footer">
        <p>&copy; 2024 Football Kits Albania. All rights reserved.<br>
            Follow us on
            <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
        </p>
    </footer>
</body>
</html>
