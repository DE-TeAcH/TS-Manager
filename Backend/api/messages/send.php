<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    sendResponse(false, "No data provided.", null, 400);
}

$chat_id = isset($data->chat_id) ? $data->chat_id : null;
$sender_id = isset($data->sender_id) ? $data->sender_id : null;
$content = isset($data->content) ? trim($data->content) : null;

if (!$chat_id || !$sender_id || !$content) {
    sendResponse(false, "Chat ID, sender ID, and content are required.", null, 400);
}

// Verify the sender is a participant of this chat
$checkQuery = "SELECT id FROM chat_participants WHERE chat_id = :chat_id AND user_id = :user_id";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(":chat_id", $chat_id);
$checkStmt->bindParam(":user_id", $sender_id);
$checkStmt->execute();

if (!$checkStmt->fetch()) {
    sendResponse(false, "User is not a participant of this chat.", null, 403);
}

try {
    $query = "INSERT INTO messages (chat_id, sender_id, content, is_read, created_at) 
              VALUES (:chat_id, :sender_id, :content, 0, NOW())";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":chat_id", $chat_id);
    $stmt->bindParam(":sender_id", $sender_id);
    $stmt->bindParam(":content", $content);
    $stmt->execute();
    
    $messageId = $db->lastInsertId();
    
    // Fetch the created message with sender info
    $fetchQuery = "SELECT m.*, u.name as sender_name, u.avatar as sender_avatar 
                   FROM messages m 
                   LEFT JOIN users u ON m.sender_id = u.id 
                   WHERE m.id = :id";
    $fetchStmt = $db->prepare($fetchQuery);
    $fetchStmt->bindParam(":id", $messageId);
    $fetchStmt->execute();
    $message = $fetchStmt->fetch(PDO::FETCH_ASSOC);
    
    sendResponse(true, "Message sent successfully.", $message);
    
} catch (Exception $e) {
    sendResponse(false, "Failed to send message: " . $e->getMessage(), null, 500);
}
?>
