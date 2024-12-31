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

// Sanitize and validate input
$productId = isset($_POST['productId']) ? $_POST['productId'] : ''; // Product ID (VARCHAR)
$productName = isset($_POST['productName']) ? $_POST['productName'] : '';
$stars = isset($_POST['rating']) ? floatval($_POST['rating']) : 0;
$ratingCount = isset($_POST['count']) ? intval($_POST['count']) : 0;
$priceCents = isset($_POST['price']) ? intval($_POST['price']) : 0; // Convert to cents
$keywords = isset($_POST['keywords']) ? $_POST['keywords'] : ''; // Keywords field (comma-separated)
$imagePath = ''; // Initialize the image path

// Validate if productId is provided
if (empty($productId)) {
    echo json_encode(["error" => "Product ID is required."]);
    exit;
}

// Convert keywords from string to array and then encode to JSON
if (!empty($keywords)) {
    // Split keywords by comma and trim any extra spaces
    $keywordsArray = array_map('trim', explode(',', $keywords)); 

    // Encode the array as JSON
    $keywordsJson = json_encode($keywordsArray);
} else {
    $keywordsJson = null; // If no keywords are provided, set it as NULL
}

// Check if the product exists
$query = "SELECT * FROM products WHERE id = ?";
$stmtCheck = $conn->prepare($query);
$stmtCheck->bind_param("s", $productId); // Bind the productId parameter
$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();

if ($resultCheck->num_rows > 0) {
    // Product exists, perform update logic
    
    // Check if an image file was uploaded
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        // Get the uploaded image file details
        $imageTmpName = $_FILES['image']['tmp_name'];
        $imageName = $_FILES['image']['name'];
        $imageExtension = strtolower(pathinfo($imageName, PATHINFO_EXTENSION));
    
        // Allowed image extensions (jpg, png, gif)
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    
        // Validate the image extension
        if (!in_array($imageExtension, $allowedExtensions)) {
            echo json_encode(["error" => "Invalid image type. Only jpg, jpeg, png, and gif are allowed."]);
            exit;
        }
    
        // Define the target path where the image will be saved (relative to the server)
        $targetDir = "C:/xampp/htdocs/kits-alb/images/products";
    
        // Ensure the target directory exists
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }
    
        // Set the image path for saving (relative path)
        $relativeImagePath = "./images/products/" . $imageName;

        // Debug: Check if the relative image path is correctly set
        error_log("Image will be saved at: " . $relativeImagePath);
        
        // Move the uploaded image to the target directory
        if (!move_uploaded_file($imageTmpName, $targetDir . "/" . $imageName)) {
            echo json_encode(["error" => "Failed to upload the image."]);
            exit;
        }
    
    } else {
       
        $currentProduct = $resultCheck->fetch_assoc();
        $relativeImagePath = $currentProduct['image'];  // Use the existing image if no new image is uploaded
    }

    // Log to check what is being passed to the database
    error_log("Saving image path: " . $relativeImagePath);

    // Update the product details in the database
    $sql = "UPDATE products SET 
                name = ?, 
                stars = ?, 
                rating_count = ?, 
                priceCents = ?,
                image = ?, 
                keywords = ? 
            WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sdiisss", $productName, $stars, $ratingCount, $priceCents, $relativeImagePath, $keywordsJson, $productId);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Product updated successfully"]);
    } else {
        echo json_encode(["error" => "Failed to update product: " . $stmt->error]);
    }

} else {
    // Product does not exist, return an error
    echo json_encode(["error" => "Product not found."]);
}

// Close statement and connection
$stmt->close();
$stmtCheck->close();
$conn->close();
?>
