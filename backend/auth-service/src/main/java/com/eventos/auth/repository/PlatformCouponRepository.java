package com.eventos.auth.repository;

import com.eventos.auth.entity.PlatformCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformCouponRepository extends JpaRepository<PlatformCoupon, UUID> {
    Optional<PlatformCoupon> findByCode(String code);
    List<PlatformCoupon> findAllByOrderByCreatedAtDesc();
}
