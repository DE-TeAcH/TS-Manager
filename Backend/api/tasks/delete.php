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
    sendResponse(false, "No task IDs provided.", null, 400);
    exit;
}

try {
    $db->beginTransaction();

    // Create placeholders
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    // 1. Delete Task Assignments (if not handled by cascade)
    $queryAssignments = "DELETE FROM task_assignments WHERE task_id IN ($placeholders)";
    $stmtAssignments = $db->prepare($queryAssignments);
    $stmtAssignments->execute($ids);

    // 2. Delete Tasks
    $queryTasks = "DELETE FROM tasks WHERE id IN ($placeholders)";
    $stmtTasks = $db->prepare($queryTasks);
    $stmtTasks->execute($ids);

    $db->commit();
    sendResponse(true, "Tasks deleted successfully.");

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Delete Tasks Error: " . $e->getMessage());
    sendResponse(false, "Failed to delete tasks: " . $e->getMessage(), null, 503);
}
?>
