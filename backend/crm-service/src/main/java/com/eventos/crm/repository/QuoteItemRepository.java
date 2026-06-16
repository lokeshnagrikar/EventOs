package com.eventos.crm.repository;

import com.eventos.crm.entity.QuoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QuoteItemRepository extends JpaRepository<QuoteItem, UUID> {
}
