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
    sendResponse(false, "No event IDs provided.", null, 400);
    exit;
}

try {
    $db->beginTransaction();

    // Create placeholders
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    // 1. Get all task IDs for these events
    $getTasksQuery = "SELECT id FROM tasks WHERE event_id IN ($placeholders)";
    $getTasksStmt = $db->prepare($getTasksQuery);
    $getTasksStmt->execute($ids);
    $taskIds = $getTasksStmt->fetchAll(PDO::FETCH_COLUMN);

    // 2. Delete group chats linked to these tasks
    if (!empty($taskIds)) {
        $taskPlaceholders = implode(',', array_fill(0, count($taskIds), '?'));
        $deleteChatsQuery = "DELETE FROM chats WHERE task_id IN ($taskPlaceholders)";
        $deleteChatsStmt = $db->prepare($deleteChatsQuery);
        $deleteChatsStmt->execute($taskIds);
    }

    // 3. Delete Tasks linked to these events
    $queryTasks = "DELETE FROM tasks WHERE event_id IN ($placeholders)";
    $stmtTasks = $db->prepare($queryTasks);
    $stmtTasks->execute($ids);

    // 4. Delete Events
    $queryEvents = "DELETE FROM events WHERE id IN ($placeholders)";
    $stmtEvents = $db->prepare($queryEvents);
    $stmtEvents->execute($ids);

    $db->commit();
    sendResponse(true, "Events deleted successfully.");

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Delete Events Error: " . $e->getMessage());
    sendResponse(false, "Failed to delete events: " . $e->getMessage(), null, 503);
}
?>
