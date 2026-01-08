<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->status)) {
    sendResponse(false, "Missing required fields.", null, 400);
}

$query = "UPDATE events SET status = :status WHERE id = :id";

$stmt = $db->prepare($query);

$stmt->bindParam(":status", $data->status);
$stmt->bindParam(":id", $data->id);

if ($stmt->execute()) {
    sendResponse(true, "Event updated successfully.", null, 200);
} else {
    sendResponse(false, "Unable to update event.", null, 503);
}
?>
