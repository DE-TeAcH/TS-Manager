<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    // Try GET param
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
    } else {
        sendResponse(false, "User ID is required.", null, 400);
    }
} else {
    $id = $data->id;
}

try {
    $db->beginTransaction();

    // 1. Delete all private chats where this user is a participant
    // First get all private chat IDs where user is a participant
    $getChatIdsQuery = "SELECT c.id FROM chats c 
                        INNER JOIN chat_participants cp ON c.id = cp.chat_id 
                        WHERE cp.user_id = :user_id AND c.type = 'private'";
    $getChatStmt = $db->prepare($getChatIdsQuery);
    $getChatStmt->bindParam(":user_id", $id);
    $getChatStmt->execute();
    $privateChatIds = $getChatStmt->fetchAll(PDO::FETCH_COLUMN);

    // Delete these private chats (will cascade to messages and participants)
    if (!empty($privateChatIds)) {
        $placeholders = implode(',', array_fill(0, count($privateChatIds), '?'));
        $deleteChatsQuery = "DELETE FROM chats WHERE id IN ($placeholders)";
        $deleteChatsStmt = $db->prepare($deleteChatsQuery);
        $deleteChatsStmt->execute($privateChatIds);
    }

    // 2. Remove user from group chats (but don't delete the group chats)
    $removeFromGroupsQuery = "DELETE FROM chat_participants WHERE user_id = :user_id";
    $removeStmt = $db->prepare($removeFromGroupsQuery);
    $removeStmt->bindParam(":user_id", $id);
    $removeStmt->execute();

    // 3. Delete the user
    $deleteUserQuery = "DELETE FROM users WHERE id = :id";
    $stmt = $db->prepare($deleteUserQuery);
    $stmt->bindParam(":id", $id);
    $stmt->execute();

    $db->commit();
    sendResponse(true, "User and associated chats deleted successfully.");

} catch (Exception $e) {
    $db->rollBack();
    error_log("Delete user error: " . $e->getMessage());
    sendResponse(false, "Unable to delete user.", null, 503);
}
?>
