package com.eventos.auth.repository;

import com.eventos.auth.entity.PasswordHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, UUID> {
    List<PasswordHistory> findTop3ByUserIdOrderByCreatedAtDesc(UUID userId);
}
