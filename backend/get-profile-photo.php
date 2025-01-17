<?php
session_start();
if (isset($_SESSION['profile_photo'])) {
    $profile_photo = $_SESSION['profile_photo'];
    echo json_encode(['profilePhoto' => $profile_photo]);
} else {
    echo json_encode(['profilePhoto' => null]);
}
?>
