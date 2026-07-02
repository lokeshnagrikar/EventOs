package com.eventos.auth.service;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckAuthDb {

    @Test
    public void checkDatabase() throws Exception {
        String dbUrl = "jdbc:postgresql://dpg-d9316pmrnols7383p940-a.singapore-postgres.render.com:5432/auth_db?sslmode=require";
        String user = "eventos_admin";
        String password = "4ojxWu6kZNnyaG4jmbeLKIWILUw1Yyn4";

        try (Connection conn = DriverManager.getConnection(dbUrl, user, password);
             Statement stmt = conn.createStatement()) {
            System.out.println("Checking auth_db...");
            
            // Print actual database name
            try (ResultSet rs = stmt.executeQuery("SELECT current_database()")) {
                if (rs.next()) {
                    System.out.println("Database Name: " + rs.getString(1));
                }
            }

            // Print all tables
            System.out.println("Tables:");
            try (ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")) {
                while (rs.next()) {
                    System.out.println(" - " + rs.getString(1));
                }
            }

            // Print roles
            System.out.println("Roles in 'roles' table:");
            try (ResultSet rs = stmt.executeQuery("SELECT id, name FROM roles")) {
                while (rs.next()) {
                    System.out.println(" - ID: " + rs.getString(1) + ", Name: " + rs.getString(2));
                }
            } catch (Exception e) {
                System.out.println("❌ Failed to query roles table: " + e.getMessage());
            }

            // Print flyway schema history
            System.out.println("Flyway Schema History:");
            try (ResultSet rs = stmt.executeQuery("SELECT version, description, success FROM flyway_schema_history")) {
                while (rs.next()) {
                    System.out.println(" - Version: " + rs.getString(1) + ", Desc: " + rs.getString(2) + ", Success: " + rs.getBoolean(3));
                }
            } catch (Exception e) {
                System.out.println("❌ Failed to query flyway history: " + e.getMessage());
            }
        }
    }
}
