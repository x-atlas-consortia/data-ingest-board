USE "usage-analytics";

CREATE TABLE "main"."ip_address" (
    id VARCHAR PRIMARY KEY,
    country VARCHAR,
    region VARCHAR,
    city VARCHAR,
    longitude DOUBLE,
    latitude DOUBLE,
    zip VARCHAR,
    created_at TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE "main"."api_usage" (
        id BIGINT PRIMARY KEY,
        host VARCHAR,
        response_id VARCHAR,
        request_date_time TIMESTAMP DEFAULT current_timestamp,
        request_date DATE,
        request_year INTEGER,
        request_month INTEGER,
        response_code INTEGER,
        http_method VARCHAR,
        resource_path VARCHAR,
        resource_path_pattern VARCHAR,
        client_ip VARCHAR,
        user_agent VARCHAR,
        entity_uuid VARCHAR,
        country_code VARCHAR,
        country_name VARCHAR,
        region_name VARCHAR,
        city_name VARCHAR,
        zip_code VARCHAR,
        user VARCHAR,
        user_domain VARCHAR,
        user_tld VARCHAR
);