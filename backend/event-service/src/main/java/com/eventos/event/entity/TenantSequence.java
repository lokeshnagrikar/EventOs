package com.eventos.event.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "tenant_sequences", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "sequence_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "sequence_type", nullable = false)
    private String sequenceType;

    @Column(name = "current_value", nullable = false)
    private long currentValue;
}
