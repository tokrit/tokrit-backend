--DROP TABLE accounts; -- Uncomment to reset db

CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    email VARCHAR(255),
    encryptedPassword VARCHAR(255),
    salt VARCHAR(255),
    firstName VARCHAR(30),
    lastName VARCHAR(30),
    created BIGINT,
    isAdmin BOOLEAN
);