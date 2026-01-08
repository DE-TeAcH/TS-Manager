<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->title) || 
    !isset($data->date) || 
    !isset($data->end_date) || 
    !isset($data->start_time) || 
    !isset($data->end_time) || 
    !isset($data->team_id)
) {
    sendResponse(false, "Missing required fields.", null, 400);
}

$query = "INSERT INTO events (title, description, date, end_date, start_time, end_time, location, team_id, status) 
          VALUES (:title, :description, :date, :end_date, :start_time, :end_time, :location, :team_id, :status)";

$stmt = $db->prepare($query);

// Set status based on room request
$status = (isset($data->request_room) && $data->request_room) ? 'pending' : 'active';

$stmt->bindParam(":title", $data->title);
$stmt->bindParam(":description", $data->description);
$stmt->bindParam(":date", $data->date);
$stmt->bindParam(":end_date", $data->end_date);
$stmt->bindParam(":start_time", $data->start_time);
$stmt->bindParam(":end_time", $data->end_time);
$stmt->bindParam(":location", $data->location);
$stmt->bindParam(":team_id", $data->team_id);
$stmt->bindParam(":status", $status);

if ($stmt->execute()) {
    sendResponse(true, "Event created successfully.", ["id" => $db->lastInsertId()], 201);
} else {
    sendResponse(false, "Unable to create event.", null, 503);
}
?>
