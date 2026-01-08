<?php
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Add column
    $sql1 = "ALTER TABLE `events` ADD COLUMN `end_date` DATE DEFAULT NULL AFTER `date`";
    $db->exec($sql1);
    echo "Column added.\n";

    // Update existing records
    $sql2 = "UPDATE `events` SET `end_date` = `date`";
    $db->exec($sql2);
    echo "Records updated.\n";

    // Modify column to NOT NULL
    $sql3 = "ALTER TABLE `events` MODIFY COLUMN `end_date` DATE NOT NULL";
    $db->exec($sql3);
    echo "Column modified to NOT NULL.\n";

    echo "Migration completed successfully.";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
}
?>
