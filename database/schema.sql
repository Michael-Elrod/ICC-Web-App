-- schema.sql

CREATE TABLE `app_user` (
    `user_id` int NOT NULL AUTO_INCREMENT,
    `user_type` varchar(12) NOT NULL,
    `user_first_name` varchar(50) NOT NULL,
    `user_last_name` varchar(50) NOT NULL,
    `user_phone` varchar(15) DEFAULT NULL,
    `user_email` varchar(50) NOT NULL,
    `password` varchar(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `notification_pref` varchar(5) DEFAULT 'email',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `user_email` (`user_email`),
    CONSTRAINT `chk_notification` CHECK (
        (
            `notification_pref` IN (
                _utf8mb4 'email',
                _utf8mb4 'text',
                _utf8mb4 'both',
                _utf8mb4 'none'
            )
        )
    ),
    CONSTRAINT `chk_user_type` CHECK (
        (
            `user_type` IN (
                _utf8mb4 'Owner',
                _utf8mb4 'Admin',
                _utf8mb4 'User',
                _utf8mb4 'Client'
            )
        )
    )
);

CREATE TABLE `invite_code` (
    `code` varchar(50) NOT NULL DEFAULT 'MYKGR53EYVYM',
    `updated_by` int NOT NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`code`),
    KEY `updated_by` (`updated_by`),
    CONSTRAINT `invite_code_ibfk_1` FOREIGN KEY (
        `updated_by`
    ) REFERENCES `app_user` (`user_id`)
);

CREATE TABLE `job` (
    `job_id` int NOT NULL AUTO_INCREMENT,
    `job_title` varchar(50) NOT NULL,
    `job_startdate` date NOT NULL,
    `job_location` varchar(50) DEFAULT NULL,
    `job_description` text,
    `client_id` int DEFAULT NULL,
    `created_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `job_status` varchar(10) NOT NULL DEFAULT 'active',
    PRIMARY KEY (`job_id`),
    KEY `client_id` (`client_id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `job_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `app_user` (
        `user_id`
    ),
    CONSTRAINT `job_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `app_user` (
        `user_id`
    ),
    CONSTRAINT `chk_job_status` CHECK (
        (`job_status` IN (_utf8mb4 'active', _utf8mb4 'closed'))
    )
);

CREATE TABLE `job_floorplan` (
    `floorplan_id` int NOT NULL AUTO_INCREMENT,
    `job_id` int NOT NULL,
    `floorplan_url` varchar(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`floorplan_id`),
    KEY `job_id` (`job_id`),
    CONSTRAINT `job_floorplan_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `job` (
        `job_id`
    ) ON DELETE CASCADE
);

CREATE TABLE `material` (
    `material_id` int NOT NULL AUTO_INCREMENT,
    `phase_id` int NOT NULL,
    `material_title` varchar(50) NOT NULL,
    `material_duedate` date NOT NULL,
    `material_description` text,
    `material_status` varchar(20) NOT NULL,
    `created_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`material_id`),
    KEY `phase_id` (`phase_id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `material_ibfk_1` FOREIGN KEY (`phase_id`) REFERENCES `phase` (
        `phase_id`
    ),
    CONSTRAINT `material_ibfk_2` FOREIGN KEY (
        `created_by`
    ) REFERENCES `app_user` (`user_id`),
    CONSTRAINT `chk_material_status` CHECK (
        (
            `material_status` IN (
                _utf8mb4 'Incomplete',
                _utf8mb4 'Complete',
                _utf8mb4 'In Progress'
            )
        )
    )
);

CREATE TABLE `note` (
    `note_id` int NOT NULL AUTO_INCREMENT,
    `phase_id` int NOT NULL,
    `note_details` text NOT NULL,
    `created_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`note_id`),
    KEY `phase_id` (`phase_id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `note_ibfk_1` FOREIGN KEY (`phase_id`) REFERENCES `phase` (
        `phase_id`
    ),
    CONSTRAINT `note_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `app_user` (
        `user_id`
    )
);

CREATE TABLE `password_reset_token` (
    `token` varchar(255) NOT NULL,
    `user_id` int NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used` tinyint(1) NOT NULL DEFAULT '0',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`token`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `password_reset_token_ibfk_1` FOREIGN KEY (
        `user_id`
    ) REFERENCES `app_user` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `phase` (
    `phase_id` int NOT NULL AUTO_INCREMENT,
    `job_id` int NOT NULL,
    `phase_title` varchar(50) NOT NULL,
    `phase_startdate` date NOT NULL,
    `phase_description` text,
    `created_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`phase_id`),
    KEY `job_id` (`job_id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `phase_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `job` (
        `job_id`
    ),
    CONSTRAINT `phase_ibfk_2` FOREIGN KEY (
        `created_by`
    ) REFERENCES `app_user` (`user_id`)
);

CREATE TABLE `task` (
    `task_id` int NOT NULL AUTO_INCREMENT,
    `phase_id` int NOT NULL,
    `task_title` varchar(50) NOT NULL,
    `task_startdate` date NOT NULL,
    `task_duration` int NOT NULL,
    `task_description` text,
    `task_status` varchar(20) NOT NULL,
    `created_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`task_id`),
    KEY `phase_id` (`phase_id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `task_ibfk_1` FOREIGN KEY (`phase_id`) REFERENCES `phase` (
        `phase_id`
    ),
    CONSTRAINT `task_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `app_user` (
        `user_id`
    ),
    CONSTRAINT `chk_task_status` CHECK (
        (
            `task_status` IN (
                _utf8mb4 'Incomplete',
                _utf8mb4 'Complete',
                _utf8mb4 'In Progress'
            )
        )
    )
);

CREATE TABLE `user_material` (
    `user_id` int NOT NULL,
    `material_id` int NOT NULL,
    `assigned_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `material_id`),
    KEY `material_id` (`material_id`),
    KEY `assigned_by` (`assigned_by`),
    CONSTRAINT `user_material_ibfk_1` FOREIGN KEY (
        `user_id`
    ) REFERENCES `app_user` (`user_id`),
    CONSTRAINT `user_material_ibfk_2` FOREIGN KEY (
        `material_id`
    ) REFERENCES `material` (`material_id`),
    CONSTRAINT `user_material_ibfk_3` FOREIGN KEY (
        `assigned_by`
    ) REFERENCES `app_user` (`user_id`)
);

CREATE TABLE `user_task` (
    `user_id` int NOT NULL,
    `task_id` int NOT NULL,
    `assigned_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `task_id`),
    KEY `task_id` (`task_id`),
    KEY `assigned_by` (`assigned_by`),
    CONSTRAINT `user_task_ibfk_1` FOREIGN KEY (
        `user_id`
    ) REFERENCES `app_user` (`user_id`),
    CONSTRAINT `user_task_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `task` (
        `task_id`
    ),
    CONSTRAINT `user_task_ibfk_3` FOREIGN KEY (
        `assigned_by`
    ) REFERENCES `app_user` (`user_id`)
);

CREATE TABLE `job_template` (
    `template_id` int NOT NULL AUTO_INCREMENT,
    `template_name` varchar(100) NOT NULL,
    `created_by` int NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`template_id`),
    KEY `created_by` (`created_by`),
    CONSTRAINT `job_template_ibfk_1` FOREIGN KEY (
        `created_by`
    ) REFERENCES `app_user` (`user_id`)
);

CREATE TABLE `template_phase` (
    `template_phase_id` int NOT NULL AUTO_INCREMENT,
    `template_id` int NOT NULL,
    `phase_title` varchar(50) NOT NULL,
    `phase_description` text,
    `phase_order` int NOT NULL,
    PRIMARY KEY (`template_phase_id`),
    KEY `template_id` (`template_id`),
    CONSTRAINT `template_phase_ibfk_1` FOREIGN KEY (
        `template_id`
    ) REFERENCES `job_template` (`template_id`) ON DELETE CASCADE
);

CREATE TABLE `template_task` (
    `template_task_id` int NOT NULL AUTO_INCREMENT,
    `template_phase_id` int NOT NULL,
    `task_title` varchar(50) NOT NULL,
    `task_duration` int NOT NULL,
    `task_offset` int NOT NULL DEFAULT 0,
    `task_description` text,
    `task_order` int NOT NULL,
    PRIMARY KEY (`template_task_id`),
    KEY `template_phase_id` (`template_phase_id`),
    CONSTRAINT `template_task_ibfk_1` FOREIGN KEY (
        `template_phase_id`
    ) REFERENCES `template_phase` (`template_phase_id`) ON DELETE CASCADE
);

CREATE TABLE `template_material` (
    `template_material_id` int NOT NULL AUTO_INCREMENT,
    `template_phase_id` int NOT NULL,
    `material_title` varchar(50) NOT NULL,
    `material_offset` int NOT NULL DEFAULT 0,
    `material_description` text,
    `material_order` int NOT NULL,
    PRIMARY KEY (`template_material_id`),
    KEY `template_phase_id` (`template_phase_id`),
    CONSTRAINT `template_material_ibfk_1` FOREIGN KEY (
        `template_phase_id`
    ) REFERENCES `template_phase` (`template_phase_id`) ON DELETE CASCADE
);

CREATE TABLE `template_task_contact` (
    `template_task_id` int NOT NULL,
    `user_id` int NOT NULL,
    PRIMARY KEY (`template_task_id`, `user_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `template_task_contact_ibfk_1` FOREIGN KEY (
        `template_task_id`
    ) REFERENCES `template_task` (`template_task_id`) ON DELETE CASCADE,
    CONSTRAINT `template_task_contact_ibfk_2` FOREIGN KEY (
        `user_id`
    ) REFERENCES `app_user` (`user_id`)
);

CREATE TABLE `template_material_contact` (
    `template_material_id` int NOT NULL,
    `user_id` int NOT NULL,
    PRIMARY KEY (`template_material_id`, `user_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `template_material_contact_ibfk_1` FOREIGN KEY (
        `template_material_id`
    ) REFERENCES `template_material` (`template_material_id`) ON DELETE CASCADE,
    CONSTRAINT `template_material_contact_ibfk_2` FOREIGN KEY (
        `user_id`
    ) REFERENCES `app_user` (`user_id`)
);
