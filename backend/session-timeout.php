<?php
session_start();

// Set the timeout duration (15 minutes)
$timeout_duration = 900; // 15 minutes in seconds

// For AJAX checks
if (isset($_GET['check_session'])) {
    header('Content-Type: application/json');
    
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'timeout']);
        exit;
    }
    
    if (isset($_SESSION['last_activity'])  && $_SESSION['user_role']!=="admin" && !isset($_COOKIE['remember_me_token'])) {
        $inactive_time = time() - $_SESSION['last_activity'];
        if ($inactive_time > $timeout_duration) {
            session_unset();
            session_destroy();
            echo json_encode(['status' => 'timeout']);
            exit;
        }
    }
    
    echo json_encode(['status' => 'active']);
    exit;
}

// Regular page load checks
if (isset($_SESSION['last_activity']) && $_SESSION['user_role']!=="admin" && !isset($_COOKIE['remember_me_token'])) {
    $inactive_time = time() - $_SESSION['last_activity'];
    if ($inactive_time > $timeout_duration) {
        session_unset();
        session_destroy();
        header("Location: login.php");
        exit;
    }
}

// Update last activity time
$_SESSION['last_activity'] = time();
?>