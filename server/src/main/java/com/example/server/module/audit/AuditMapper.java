package com.example.server.module.audit;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Mapper
public interface AuditMapper {

    void insert(@Param("actorId") UUID actorId, @Param("action") String action,
                @Param("entityType") String entityType, @Param("entityId") UUID entityId);

    /** Idempotent on (zitadelAggregateId, zitadelSequence) -- see ZitadelEventSyncJob. */
    void insertZitadelEvent(@Param("actorId") UUID actorId, @Param("action") String action,
                             @Param("entityType") String entityType, @Param("createdAt") Instant createdAt,
                             @Param("zitadelAggregateId") String zitadelAggregateId,
                             @Param("zitadelSequence") long zitadelSequence);

    /** Sync watermark for ZitadelEventSyncJob -- null before the first Zitadel event is ever synced. */
    Instant findLatestZitadelEventCreatedAt();

    List<AuditLog> search(@Param("date") LocalDate date, @Param("actorId") UUID actorId,
                           @Param("entityType") String entityType, @Param("limit") int limit,
                           @Param("offset") int offset);

    long count(@Param("date") LocalDate date, @Param("actorId") UUID actorId,
               @Param("entityType") String entityType);

    List<LocalDate> findDistinctDays();

    List<AuditLog> findAllForDate(@Param("date") LocalDate date);
}
