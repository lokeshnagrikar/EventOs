import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class CheckBCrypt {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("Matches: " + encoder.matches("admin123", "$2a$10$T8Z.1i/sZkM8l5t9iLhS1.yZ9Kz5f3PzVpU9tM1F2O7mYw5mJzM/O"));
        System.out.println("New Hash: " + encoder.encode("admin123"));
    }
}
