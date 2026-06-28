package com.eventos.gallery.repository;

import com.eventos.gallery.entity.ShareLinkAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShareLinkAccessLogRepository extends JpaRepository<ShareLinkAccessLog, UUID> {
    List<ShareLinkAccessLog> findAllByToken(String token);
    List<ShareLinkAccessLog> findAllByTenantIdAndToken(UUID tenantId, String token);
}
