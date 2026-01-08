<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "ALTER TABLE users 
              ADD COLUMN bac_matricule VARCHAR(8) NULL AFTER email,
              ADD COLUMN bac_year INT NULL AFTER bac_matricule";
    
    $db->exec($query);
    echo "Successfully added bac_matricule and bac_year columns to users table.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Columns already exist. Skipping.\n";
    } else {
        echo "Error updating database: " . $e->getMessage() . "\n";
    }
}
?>
