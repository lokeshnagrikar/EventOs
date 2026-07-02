package com.eventos.auth.repository;

import com.eventos.auth.entity.User2Fa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface User2FaRepository extends JpaRepository<User2Fa, UUID> {
}
