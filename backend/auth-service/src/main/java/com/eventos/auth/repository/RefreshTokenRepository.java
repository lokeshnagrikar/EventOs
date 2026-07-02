package com.eventos.auth.repository;

import com.eventos.auth.entity.RefreshToken;
import com.eventos.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);
    
    @Modifying
    void deleteByUser(User user);
    
    void deleteByToken(String token);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
    void deleteExpiredTokens(@org.springframework.data.repository.query.Param("now") java.time.LocalDateTime now);
}
