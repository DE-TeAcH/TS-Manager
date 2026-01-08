<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    sendResponse(false, "Task ID is required.", null, 400);
}

// Build dynamic update query
$fields = [];
$params = [":id" => $data->id];

if (isset($data->title)) {
    $fields[] = "title = :title";
    $params[":title"] = $data->title;
}
if (isset($data->description)) {
    $fields[] = "description = :description";
    $params[":description"] = $data->description;
}
if (isset($data->assigned_to)) {
    $fields[] = "assigned_to = :assigned_to";
    $params[":assigned_to"] = $data->assigned_to;
}
if (isset($data->status)) {
    $fields[] = "status = :status";
    $params[":status"] = $data->status;
}

if (empty($fields)) {
    sendResponse(false, "No fields to update.", null, 400);
}

$query = "UPDATE tasks SET " . implode(", ", $fields) . " WHERE id = :id";
$stmt = $db->prepare($query);

if ($stmt->execute($params)) {
    sendResponse(true, "Task updated successfully.");
} else {
    sendResponse(false, "Unable to update task.", null, 503);
}
?>
