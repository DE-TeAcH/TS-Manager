<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Starting migration: Add category column to teams table...\n";

try {
    // 1. Add the column if it doesn't exist
    $checkColumn = "SHOW COLUMNS FROM teams LIKE 'category'";
    $stmt = $db->prepare($checkColumn);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        $alterQuery = "ALTER TABLE teams ADD COLUMN category VARCHAR(255) AFTER name";
        $db->exec($alterQuery);
        echo "Added 'category' column to 'teams' table.\n";
    } else {
        echo "'category' column already exists. Proceeding to data migration.\n";
    }

    // 2. Migrate data
    $query = "SELECT id, description FROM teams";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Found " . count($teams) . " teams. Checking for data to migrate...\n";

    foreach ($teams as $team) {
        if (preg_match('/^\[(.*?)\]\s*(.*)$/s', $team['description'], $matches)) {
            $category = $matches[1];
            $cleanDescription = $matches[2];
            
            // Update the record
            $updateQuery = "UPDATE teams SET category = :category, description = :description WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':category', $category);
            $updateStmt->bindParam(':description', $cleanDescription);
            $updateStmt->bindParam(':id', $team['id']);
            
            if ($updateStmt->execute()) {
                echo "Migrated team ID {$team['id']}: Category='{$category}'\n";
            } else {
                echo "Failed to migrate team ID {$team['id']}\n";
            }
        }
    }

    echo "Migration completed successfully.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
