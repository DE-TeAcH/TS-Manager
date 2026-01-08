<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->task_ids) || 
    !is_array($data->task_ids) ||
    !isset($data->status)
) {
    sendResponse(false, "Missing required fields (task_ids array, status).", null, 400);
}

try {
    $db->beginTransaction();

    $query = "UPDATE tasks SET status = :status WHERE id = :id";
    $stmt = $db->prepare($query);

    foreach ($data->task_ids as $taskId) {
        $stmt->bindParam(":status", $data->status);
        $stmt->bindParam(":id", $taskId);
        $stmt->execute();
    }

    $db->commit();
    sendResponse(true, "Tasks status updated successfully.", null, 200);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Bulk status update error: " . $e->getMessage());
    sendResponse(false, "Unable to update tasks status.", null, 503);
}
?>
