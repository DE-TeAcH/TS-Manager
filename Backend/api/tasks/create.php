<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->title) || 
    !isset($data->event_id) ||
    !isset($data->department_id)
) {
    error_log("Task creation failed - Missing fields. Data: " . json_encode($data));
    sendResponse(false, "Missing required fields (title, event_id, department_id).", null, 400);
}

// Log what we received
error_log("Creating task with department_id: " . $data->department_id);

$query = "INSERT INTO tasks (title, description, event_id, department_id, status) 
          VALUES (:title, :description, :event_id, :department_id, 'pending')";

$stmt = $db->prepare($query);

$stmt->bindParam(":title", $data->title);
$stmt->bindParam(":description", $data->description);
$stmt->bindParam(":event_id", $data->event_id);
$stmt->bindParam(":department_id", $data->department_id, PDO::PARAM_INT); // Explicitly set as integer

if ($stmt->execute()) {
    sendResponse(true, "Task created successfully.", ["id" => $db->lastInsertId()], 201);
} else {
    error_log("Task creation SQL error: " . json_encode($stmt->errorInfo()));
    sendResponse(false, "Unable to create task.", null, 503);
}
?>
