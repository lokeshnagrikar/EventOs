package com.eventos.auth.repository;

import com.eventos.auth.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    
    List<Session> findAllByUserId(UUID userId);
    
    List<Session> findAllByUserIdAndTenantId(UUID userId, UUID tenantId);
    
    Optional<Session> findByRefreshTokenId(UUID refreshTokenId);
    
    @Modifying
    @Query("DELETE FROM Session s WHERE s.refreshToken.id = :tokenId")
    void deleteByRefreshTokenId(@Param("tokenId") UUID tokenId);
    
    @Modifying
    @Query("DELETE FROM Session s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
