<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$ids = [];

if (isset($data->ids) && is_array($data->ids)) {
    $ids = $data->ids;
} elseif (isset($data->id)) {
    $ids = [$data->id];
}

if (empty($ids)) {
    sendResponse(false, "No department IDs provided.", null, 400);
    exit;
}

try {
    $db->beginTransaction();

    // Create placeholders
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    // 1. Unlink Users (Set department_id to NULL)
    $queryUsers = "UPDATE users SET department_id = NULL WHERE department_id IN ($placeholders)";
    $stmtUsers = $db->prepare($queryUsers);
    $stmtUsers->execute($ids);

    // 2. Delete Tasks linked to these departments
    $queryTasks = "DELETE FROM tasks WHERE department_id IN ($placeholders)";
    $stmtTasks = $db->prepare($queryTasks);
    $stmtTasks->execute($ids);

    // 3. Delete Departments
    $queryDepts = "DELETE FROM departments WHERE id IN ($placeholders)";
    $stmtDepts = $db->prepare($queryDepts);
    $stmtDepts->execute($ids);

    $db->commit();
    sendResponse(true, "Departments deleted successfully.");

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Delete Departments Error: " . $e->getMessage());
    sendResponse(false, "Failed to delete departments: " . $e->getMessage(), null, 503);
}
?>
