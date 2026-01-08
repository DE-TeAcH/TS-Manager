<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$username = "adminUni";
$password = "AdminUni";
$hashed_password = password_hash($password, PASSWORD_DEFAULT);
$name = "University Admin";
$email = "admin@university.edu";
$role = "admin";

// Check if admin exists
$check_query = "SELECT id FROM users WHERE username = :username";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(":username", $username);
$check_stmt->execute();

if ($check_stmt->rowCount() > 0) {
    // Update existing admin
    $query = "UPDATE users SET password = :password WHERE username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":password", $hashed_password);
    $stmt->bindParam(":username", $username);
    
    if ($stmt->execute()) {
        echo "Admin password updated successfully.";
    } else {
        echo "Error updating admin password.";
    }
} else {
    // Create new admin
    $query = "INSERT INTO users (username, password, name, email, role, join_date) VALUES (:username, :password, :name, :email, :role, CURDATE())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $username);
    $stmt->bindParam(":password", $hashed_password);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":role", $role);
    
    if ($stmt->execute()) {
        echo "Admin user created successfully.";
    } else {
        echo "Error creating admin user.";
    }
}
?>
