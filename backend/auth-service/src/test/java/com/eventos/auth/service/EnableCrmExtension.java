package com.eventos.auth.service;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class EnableCrmExtension {

    @Test
    public void enableExtension() throws Exception {
        String dbUrl = "jdbc:postgresql://dpg-d9316pmrnols7383p940-a.singapore-postgres.render.com:5432/crm_db?sslmode=require";
        String user = "eventos_admin";
        String password = "4ojxWu6kZNnyaG4jmbeLKIWILUw1Yyn4";

        System.out.println("Connecting directly to crm_db to enable uuid-ossp...");
        try (Connection conn = DriverManager.getConnection(dbUrl, user, password);
             Statement stmt = conn.createStatement()) {
            
            // Print connected database
            try (ResultSet rs = stmt.executeQuery("SELECT current_database()")) {
                if (rs.next()) {
                    System.out.println("Connected to database: " + rs.getString(1));
                }
            }

            // Attempt to create extension and catch direct SQL exceptions
            try {
                System.out.println("Running: CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"...");
                stmt.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
                System.out.println("✅ Statement executed successfully!");
            } catch (Exception e) {
                System.out.println("❌ SQL Exception caught: " + e.getMessage());
                e.printStackTrace();
            }

            // Verify
            try (ResultSet rs = stmt.executeQuery("SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'")) {
                if (rs.next()) {
                    System.out.println("✅ Extension 'uuid-ossp' verified in pg_extension!");
                } else {
                    System.out.println("❌ Extension still not found in pg_extension.");
                }
            }
        }
    }
}
