package com.eventos.auth.service;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckCrmDb {

    @Test
    public void testUuidExtension() throws Exception {
        String dbUrl = "jdbc:postgresql://dpg-d9316pmrnols7383p940-a.singapore-postgres.render.com:5432/crm_db?sslmode=require";
        String user = "eventos_admin";
        String password = "4ojxWu6kZNnyaG4jmbeLKIWILUw1Yyn4";

        try (Connection conn = DriverManager.getConnection(dbUrl, user, password);
             Statement stmt = conn.createStatement()) {
            System.out.println("Checking uuid-ossp extension in crm_db...");
            
            // Print actual database we are connected to!
            try (ResultSet rs = stmt.executeQuery("SELECT current_database()")) {
                if (rs.next()) {
                    System.out.println("Actual Connected Database: " + rs.getString(1));
                }
            }

            // 1. Check if extension exists in pg_extension
            try (ResultSet rs = stmt.executeQuery("SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'")) {
                if (rs.next()) {
                    System.out.println("✅ Extension 'uuid-ossp' exists in pg_extension!");
                } else {
                    System.out.println("❌ Extension 'uuid-ossp' does NOT exist in pg_extension!");
                }
            }

            // 2. Check if we can run uuid_generate_v4()
            try (ResultSet rs = stmt.executeQuery("SELECT uuid_generate_v4()")) {
                if (rs.next()) {
                    System.out.println("✅ Successfully executed uuid_generate_v4(): " + rs.getString(1));
                }
            } catch (Exception e) {
                System.out.println("❌ Failed to execute uuid_generate_v4(): " + e.getMessage());
            }

            // 3. Check database schemas and search path
            try (ResultSet rs = stmt.executeQuery("SHOW search_path")) {
                if (rs.next()) {
                    System.out.println("Current search_path: " + rs.getString(1));
                }
            }
        }
    }
}
