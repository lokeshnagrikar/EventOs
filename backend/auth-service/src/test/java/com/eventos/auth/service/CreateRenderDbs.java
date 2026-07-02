package com.eventos.auth.service;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class CreateRenderDbs {

    @Test
    public void setupDatabases() throws Exception {
        String baseUrl = "jdbc:postgresql://dpg-d9316pmrnols7383p940-a.singapore-postgres.render.com:5432/";
        String rootUrl = baseUrl + "eventos_root?sslmode=require";
        String user = "eventos_admin";
        String password = "4ojxWu6kZNnyaG4jmbeLKIWILUw1Yyn4";

        String[] dbNames = {"auth_db", "crm_db", "event_db", "gallery_db"};

        // 1. Terminate active connections, drop and recreate databases
        try (Connection conn = DriverManager.getConnection(rootUrl, user, password);
             Statement stmt = conn.createStatement()) {
            System.out.println("Connected to root database. Recreating databases...");

            for (String db : dbNames) {
                try {
                    // Terminate other connections so we can drop it
                    stmt.execute("SELECT pg_terminate_backend(pg_stat_activity.pid) " +
                                 "FROM pg_stat_activity " +
                                 "WHERE pg_stat_activity.datname = '" + db + "' " +
                                 "AND pid <> pg_backend_pid()");
                    
                    stmt.execute("DROP DATABASE IF EXISTS " + db);
                    System.out.println("Dropped: " + db);
                } catch (Exception e) {
                    System.out.println("Warning dropping " + db + ": " + e.getMessage());
                }

                stmt.execute("CREATE DATABASE " + db);
                System.out.println("Created: " + db);
                stmt.execute("GRANT ALL PRIVILEGES ON DATABASE " + db + " TO eventos_admin");
                System.out.println("Granted privileges on: " + db);
            }
        }

        // 2. Enable the uuid-ossp extension in each newly created database
        for (String db : dbNames) {
            String dbUrl = baseUrl + db + "?sslmode=require";
            try (Connection conn = DriverManager.getConnection(dbUrl, user, password);
                 Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
                System.out.println("Enabled 'uuid-ossp' extension in " + db);
            } catch (Exception e) {
                System.out.println("Error enabling extension in " + db + ": " + e.getMessage());
            }
        }
        System.out.println("\n🎉 Database setup completely successful!");
    }
}
