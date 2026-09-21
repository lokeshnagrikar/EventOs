package com.eventos.auth.repository;

import com.eventos.auth.entity.PlatformAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformAnnouncementRepository extends JpaRepository<PlatformAnnouncement, UUID> {
    List<PlatformAnnouncement> findAllByOrderByCreatedAtDesc();
}
