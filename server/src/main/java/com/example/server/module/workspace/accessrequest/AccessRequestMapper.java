package com.example.server.module.workspace.accessrequest;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface AccessRequestMapper {

    void insert(@Param("requestId") UUID requestId, @Param("requestType") String requestType,
                @Param("fullName") String fullName, @Param("email") String email,
                @Param("departmentId") UUID departmentId, @Param("existingUserId") UUID existingUserId);

    AccessRequest findById(@Param("requestId") UUID requestId);

    List<AccessRequest> findByDepartment(@Param("departmentId") UUID departmentId, @Param("status") String status,
                                          @Param("limit") int limit, @Param("offset") int offset);

    long countByDepartment(@Param("departmentId") UUID departmentId, @Param("status") String status);

    void approveNewAccount(@Param("requestId") UUID requestId, @Param("reviewedBy") UUID reviewedBy,
                            @Param("createdUserId") UUID createdUserId);

    void approveUnlock(@Param("requestId") UUID requestId, @Param("reviewedBy") UUID reviewedBy);

    void reject(@Param("requestId") UUID requestId, @Param("reviewedBy") UUID reviewedBy);
}
