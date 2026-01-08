<?php
/**
 * Auto-initialize chats for a user based on their role
 * Called on login to ensure required private chats exist
 * 
 * - Dept Head: gets private chat with team leader + with each dept member
 * - Team Leader: gets private chat with each dept head in their team
 * - Member: gets private chat with their dept head
 */
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    sendResponse(false, "User ID is required.", null, 400);
}

$userId = $data->user_id;

try {
    // Get user info
    $userQuery = "SELECT u.*, d.dept_head_id FROM users u 
                  LEFT JOIN departments d ON u.department_id = d.id 
                  WHERE u.id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(":user_id", $userId);
    $userStmt->execute();
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        sendResponse(false, "User not found.", null, 404);
    }

    $chatsCreated = 0;

    // Helper function to create private chat if not exists
    $createPrivateChatIfNotExists = function($user1Id, $user2Id) use ($db, &$chatsCreated) {
        // Check if chat already exists
        $checkQuery = "SELECT c.id FROM chats c
                       INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = :user1
                       INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = :user2
                       WHERE c.type = 'private' LIMIT 1";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":user1", $user1Id);
        $checkStmt->bindParam(":user2", $user2Id);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            // Create new private chat
            $createQuery = "INSERT INTO chats (type) VALUES ('private')";
            $createStmt = $db->prepare($createQuery);
            $createStmt->execute();
            $chatId = $db->lastInsertId();

            // Add participants
            $addQuery = "INSERT INTO chat_participants (chat_id, user_id) VALUES (:chat_id, :user_id)";
            $addStmt = $db->prepare($addQuery);
            
            $addStmt->bindParam(":chat_id", $chatId);
            $addStmt->bindParam(":user_id", $user1Id);
            $addStmt->execute();
            
            $addStmt->bindParam(":chat_id", $chatId);
            $addStmt->bindParam(":user_id", $user2Id);
            $addStmt->execute();

            $chatsCreated++;
            return $chatId;
        }
        return null;
    };

    // Track allowed allowed counterparts to clean up old chats
    $allowedCounterpartIds = [];

    switch ($user['role']) {
        case 'team-leader':
            // Create private chats with all dept heads in their team
            $deptHeadsQuery = "SELECT DISTINCT d.dept_head_id FROM departments d 
                               WHERE d.team_id = :team_id AND d.dept_head_id IS NOT NULL";
            $deptHeadsStmt = $db->prepare($deptHeadsQuery);
            $deptHeadsStmt->bindParam(":team_id", $user['team_id']);
            $deptHeadsStmt->execute();
            $deptHeads = $deptHeadsStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($deptHeads as $deptHeadId) {
                if ($deptHeadId) {
                    $createPrivateChatIfNotExists($userId, $deptHeadId);
                    $allowedCounterpartIds[] = $deptHeadId;
                }
            }
            break;

        case 'dept-head':
            // 1. Create private chat with team leader
            $leaderQuery = "SELECT id FROM users WHERE team_id = :team_id AND role = 'team-leader' LIMIT 1";
            $leaderStmt = $db->prepare($leaderQuery);
            $leaderStmt->bindParam(":team_id", $user['team_id']);
            $leaderStmt->execute();
            $leader = $leaderStmt->fetch(PDO::FETCH_ASSOC);

            if ($leader) {
                $createPrivateChatIfNotExists($userId, $leader['id']);
                $allowedCounterpartIds[] = $leader['id'];
            }

            // 2. Create private chats with department members
            $membersQuery = "SELECT id FROM users WHERE department_id = :dept_id AND role = 'member'";
            $membersStmt = $db->prepare($membersQuery);
            $membersStmt->bindParam(":dept_id", $user['department_id']);
            $membersStmt->execute();
            $members = $membersStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($members as $memberId) {
                $createPrivateChatIfNotExists($userId, $memberId);
                $allowedCounterpartIds[] = $memberId;
            }
            break;

        case 'member':
            // Create private chat with dept head
            if (!empty($user['dept_head_id'])) {
                $createPrivateChatIfNotExists($userId, $user['dept_head_id']);
                $allowedCounterpartIds[] = $user['dept_head_id'];
            }
            break;
    }

    // --- CLEANUP LOGIC ---
    // Only perform cleanup for specific hierarchical roles where automated chat management is required
    if (in_array($user['role'], ['member', 'dept-head', 'team-leader'])) {
        // Delete private chats where the other participant is NOT in $allowedCounterpartIds
        
        // 1. Get all private chats for this user
        $getChatsQuery = "SELECT c.id, cp_other.user_id as other_user_id 
                          FROM chats c
                          JOIN chat_participants cp_me ON c.id = cp_me.chat_id AND cp_me.user_id = :my_id
                          JOIN chat_participants cp_other ON c.id = cp_other.chat_id AND cp_other.user_id != :my_id
                          WHERE c.type = 'private'";
        
        $getChatsStmt = $db->prepare($getChatsQuery);
        $getChatsStmt->bindParam(":my_id", $userId);
        $getChatsStmt->execute();
        $existingChats = $getChatsStmt->fetchAll(PDO::FETCH_ASSOC);

        $chatsDeleted = 0;

        if (!empty($existingChats)) {
            foreach ($existingChats as $chat) {
                // Check if the other user is still a valid counterpart
                if (!in_array($chat['other_user_id'], $allowedCounterpartIds)) {
                    
                    // This chat is no longer valid. Delete it.
                    $delMsg = $db->prepare("DELETE FROM messages WHERE chat_id = :chat_id");
                    $delMsg->bindParam(":chat_id", $chat['id']);
                    $delMsg->execute();

                    $delPart = $db->prepare("DELETE FROM chat_participants WHERE chat_id = :chat_id");
                    $delPart->bindParam(":chat_id", $chat['id']);
                    $delPart->execute();

                    $delChat = $db->prepare("DELETE FROM chats WHERE id = :chat_id");
                    $delChat->bindParam(":chat_id", $chat['id']);
                    $delChat->execute();

                    $chatsDeleted++;
                }
            }
        }
    }

    sendResponse(true, "Chats initialized successfully.", [
        'chats_created' => $chatsCreated,
        'chats_deleted' => $chatsDeleted
    ]);

} catch (Exception $e) {
    error_log("Init chats error: " . $e->getMessage());
    sendResponse(false, "Unable to initialize chats.", null, 503);
}
?>
