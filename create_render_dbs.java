import java.sql.*;

public class create_render_dbs {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://dpg-d9316pmrnols7383p940-a.singapore-postgres.render.com:5432/eventos_root?sslmode=require";
        String user = "eventos_admin";
        String password = "4ojxWu6kZNnyaG4jmbeLKIWILUw1Yyn4";

        String[] commands = {
            "CREATE DATABASE auth_db",
            "CREATE DATABASE crm_db",
            "CREATE DATABASE event_db",
            "CREATE DATABASE gallery_db",
            "GRANT ALL PRIVILEGES ON DATABASE auth_db TO eventos_admin",
            "GRANT ALL PRIVILEGES ON DATABASE crm_db TO eventos_admin",
            "GRANT ALL PRIVILEGES ON DATABASE event_db TO eventos_admin",
            "GRANT ALL PRIVILEGES ON DATABASE gallery_db TO eventos_admin"
        };

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            System.out.println("✅ Connected to Render PostgreSQL!");
            for (String sql : commands) {
                try {
                    stmt.execute(sql);
                    System.out.println("✅ " + sql);
                } catch (SQLException e) {
                    System.out.println("⚠️  " + sql + " → " + e.getMessage());
                }
            }
            System.out.println("\n🎉 Done! All databases created.");
        }
    }
}
