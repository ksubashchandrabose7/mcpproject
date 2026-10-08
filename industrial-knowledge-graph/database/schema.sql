-- ============================================================
-- AI-Powered Industrial Knowledge Graph - Database Schema
-- ============================================================
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS industrial_kg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE industrial_kg;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ============================================================
-- DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT DEFAULT 0,
    extracted_text LONGTEXT,
    status VARCHAR(50) DEFAULT 'pending',
    entity_count INT DEFAULT 0,
    relationship_count INT DEFAULT 0,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    error_message VARCHAR(1000),
    INDEX idx_documents_status (status),
    INDEX idx_documents_uploaded_at (uploaded_at)
) ENGINE=InnoDB;

-- ============================================================
-- DOCUMENT CHUNKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    chunk_index INT NOT NULL,
    chunk_text LONGTEXT NOT NULL,
    embedding LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX idx_chunks_document_id (document_id)
) ENGINE=InnoDB;

-- ============================================================
-- ENTITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS entities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT,
    entity_name VARCHAR(500) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    description VARCHAR(1000),
    confidence FLOAT DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    INDEX idx_entities_type (entity_type),
    INDEX idx_entities_name (entity_name(100)),
    INDEX idx_entities_document_id (document_id)
) ENGINE=InnoDB;

-- ============================================================
-- RELATIONSHIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_entity_id INT NOT NULL,
    target_entity_id INT NOT NULL,
    relationship_type VARCHAR(100) NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    document_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    INDEX idx_rel_source (source_entity_id),
    INDEX idx_rel_target (target_entity_id),
    INDEX idx_rel_type (relationship_type)
) ENGINE=InnoDB;

-- ============================================================
-- KNOWLEDGE GRAPH NODES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id INT NOT NULL UNIQUE,
    node_label VARCHAR(500) NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    properties LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    INDEX idx_kg_nodes_type (node_type),
    INDEX idx_kg_nodes_label (node_label(100))
) ENGINE=InnoDB;

-- ============================================================
-- KNOWLEDGE GRAPH EDGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_node_id INT NOT NULL,
    target_node_id INT NOT NULL,
    relationship_id INT NOT NULL,
    edge_label VARCHAR(200) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_node_id) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (relationship_id) REFERENCES relationships(id) ON DELETE CASCADE,
    INDEX idx_kg_edges_source (source_node_id),
    INDEX idx_kg_edges_target (target_node_id)
) ENGINE=InnoDB;

-- ============================================================
-- QA HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS qa_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question LONGTEXT NOT NULL,
    answer LONGTEXT NOT NULL,
    sources LONGTEXT,
    entities_used LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_qa_history_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SEARCH HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    query VARCHAR(1000) NOT NULL,
    result_count INT DEFAULT 0,
    search_type VARCHAR(50) DEFAULT 'semantic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_search_history_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SHOW CREATED TABLES
-- ============================================================
SHOW TABLES;
SELECT 'Database schema created successfully!' AS status;
