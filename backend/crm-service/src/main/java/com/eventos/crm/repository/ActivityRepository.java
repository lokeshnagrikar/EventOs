package com.eventos.crm.repository;

import com.eventos.crm.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByLeadIdOrderByCreatedAtDesc(UUID leadId);
}
