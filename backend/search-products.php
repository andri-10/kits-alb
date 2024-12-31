<?php
// Database connection (inline)
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Sanitize input
$search = isset($_GET['search']) ? $_GET['search'] : '';

// If the search term is empty, return all products (optional)
if (empty($search)) {
    $query = "SELECT * FROM products";
} else {
    // Use prepared statements to avoid SQL injection
    $search = "%" . $search . "%"; // Prepare search term for LIKE clause

    // Search for products by name and keywords (assuming 'keywords' is a JSON field)
    $query = "
        SELECT * FROM products
        WHERE name LIKE ?
        OR JSON_UNQUOTE(JSON_EXTRACT(keywords, '$[*]')) LIKE ?
    ";
}

// Prepare the query
$stmt = $conn->prepare($query);
if ($search !== "%") {
    // Bind parameters to the query
    $stmt->bind_param("ss", $search, $search); // Both parameters are strings
} else {
    $stmt->execute(); // No binding if the search term is empty
}

// Execute the query
$stmt->execute();
$result = $stmt->get_result();

// Check if query was successful
if (!$result) {
    echo json_encode(["error" => "Query failed: " . $stmt->error]);
    exit;
}

// Fetch all products
$products = $result->fetch_all(MYSQLI_ASSOC);

// Return the products as a JSON response
echo json_encode($products);

// Close statement and connection
$stmt->close();
$conn->close();
?>
