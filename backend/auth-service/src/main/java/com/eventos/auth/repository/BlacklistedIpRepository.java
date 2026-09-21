package com.eventos.auth.repository;

import com.eventos.auth.entity.BlacklistedIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BlacklistedIpRepository extends JpaRepository<BlacklistedIp, UUID> {
    Optional<BlacklistedIp> findByIpAddress(String ipAddress);
    List<BlacklistedIp> findAllByOrderByCreatedAtDesc();
    void deleteByIpAddress(String ipAddress);
}
