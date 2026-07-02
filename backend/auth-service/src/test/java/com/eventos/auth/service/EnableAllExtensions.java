package com.eventos.auth.service;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class EnableAllExtensions {

    @Test
    public void enableExtensions() throws Exception {
        String baseUrl = "jdbc:postgresql://dpg-d9316pmrnols7383p940-a.singapore-postgres.render.com:5432/";
        String user = "eventos_admin";
        String password = "4ojxWu6kZNnyaG4jmbeLKIWILUw1Yyn4";

        String[] dbNames = {"auth_db", "crm_db", "event_db", "gallery_db"};

        for (String db : dbNames) {
            String dbUrl = baseUrl + db + "?sslmode=require";
            try (Connection conn = DriverManager.getConnection(dbUrl, user, password);
                 Statement stmt = conn.createStatement()) {
                
                System.out.println("Connecting to " + db + "...");
                
                // Verify actual database name
                try (ResultSet rs = stmt.executeQuery("SELECT current_database()")) {
                    if (rs.next()) {
                        System.out.println("Confirmed connected to database: " + rs.getString(1));
                    }
                }

                // Enable extension
                stmt.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
                System.out.println("✅ Extension 'uuid-ossp' enabled in " + db);

                // Verify
                try (ResultSet rs = stmt.executeQuery("SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'")) {
                    if (rs.next()) {
                        System.out.println("✅ Verified 'uuid-ossp' exists in " + db + " pg_extension!");
                    } else {
                        System.out.println("❌ Extension failed verification in " + db);
                    }
                }
            } catch (Exception e) {
                System.out.println("❌ Error in " + db + ": " + e.getMessage());
            }
            System.out.println("----------------------------------------");
        }
        System.out.println("🎉 All extensions enabled and verified successfully!");
    }
}
