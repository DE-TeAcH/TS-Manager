-- Migration: Add Chat System Tables
-- Date: 2025-12-13
-- Description: Creates chats and chat_participants tables for private and group messaging

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE IF NOT EXISTS `chats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('private','group') NOT NULL,
  `name` varchar(255) DEFAULT NULL COMMENT 'Display name for group chats',
  `task_id` int(11) DEFAULT NULL COMMENT 'Links group chat to a task',
  `created_at` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `chat_participants`
--

CREATE TABLE IF NOT EXISTS `chat_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chat_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `chat_user_unique` (`chat_id`, `user_id`),
  KEY `chat_id` (`chat_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Constraints for table `chats`
--

ALTER TABLE `chats`
  ADD CONSTRAINT `chats_task_fk` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Constraints for table `chat_participants`
--

ALTER TABLE `chat_participants`
  ADD CONSTRAINT `chat_participants_chat_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_participants_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Update messages table to properly reference chats
-- Note: The messages table already has chat_id column based on the schema image
-- We just need to add the foreign key constraint
--

ALTER TABLE `messages`
  ADD CONSTRAINT `messages_chat_fk` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE;

COMMIT;
