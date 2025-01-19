<?php
session_start();
// Stripe API keys
define('STRIPE_SECRET_KEY', 'sk_test_51QingtJvqD1LcS3xATWdxx8CoH2x5MG2AcCIdPfkC0VkqfvBWzo4Sf2x6FxXNuXQPoGK3mAOf0ng3lqnx1eWppsR00s2Li0JwF');
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_51QingtJvqD1LcS3xYG4Frz4qh9htiMyRoTGr0weMwD5dROi3d6Iuj9LRTKC7HP2jdlL57jNtOI8Q1d4W0Pw7UfJI004aeLOIFC');

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'web');