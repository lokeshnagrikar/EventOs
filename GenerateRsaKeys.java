import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Base64;

public class GenerateRsaKeys {
    public static void main(String[] args) throws Exception {
        KeyPairGenerator keyGen = KeyPairGenerator.getInstance("RSA");
        keyGen.initialize(2048);
        KeyPair pair = keyGen.generateKeyPair();
        RSAPrivateKey priv = (RSAPrivateKey) pair.getPrivate();
        RSAPublicKey pub = (RSAPublicKey) pair.getPublic();

        String privPem = "-----BEGIN PRIVATE KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(priv.getEncoded()) +
                "\n-----END PRIVATE KEY-----";

        String pubPem = "-----BEGIN PUBLIC KEY-----\n" +
                Base64.getMimeEncoder(64, new byte[]{'\n'}).encodeToString(pub.getEncoded()) +
                "\n-----END PUBLIC KEY-----";

        System.out.println("JWT_PRIVATE_KEY_PEM:");
        System.out.println(privPem);
        System.out.println();
        System.out.println("JWT_PUBLIC_KEY_PEM:");
        System.out.println(pubPem);
    }
}
