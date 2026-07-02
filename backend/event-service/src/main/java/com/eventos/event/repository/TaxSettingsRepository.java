package com.eventos.event.repository;

import com.eventos.event.entity.TaxSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface TaxSettingsRepository extends JpaRepository<TaxSettings, UUID> {
}
