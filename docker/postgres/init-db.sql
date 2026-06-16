-- Create separate database schemas for microservices
CREATE DATABASE auth_db;
CREATE DATABASE crm_db;
CREATE DATABASE event_db;
CREATE DATABASE payment_db;
CREATE DATABASE gallery_db;

-- Connect to auth_db and set up extensions
\c auth_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to crm_db and set up extensions
\c crm_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to event_db and set up extensions
\c event_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to payment_db and set up extensions
\c payment_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Connect to gallery_db and set up extensions
\c gallery_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
