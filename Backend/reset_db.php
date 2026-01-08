<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Disable foreign key checks to allow truncation
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");

    $tables = ['messages', 'tasks', 'events', 'users', 'departments', 'teams'];

    foreach ($tables as $table) {
        $db->exec("TRUNCATE TABLE $table");
        echo "Table $table truncated.<br>";
    }

    // Re-enable foreign key checks
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Re-create Admin User
    $password_hash = password_hash("AdminUni", PASSWORD_BCRYPT);
    $query = "INSERT INTO users (username, password, name, email, role, join_date, created_at) VALUES ('adminUni', :password, 'Admin User', 'admin@university.edu', 'admin', CURDATE(), NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":password", $password_hash);
    
    if($stmt->execute()) {
        echo "Admin user 'adminUni' recreated successfully.<br>";
    } else {
        echo "Failed to recreate admin user.<br>";
    }

    echo "Database reset successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
