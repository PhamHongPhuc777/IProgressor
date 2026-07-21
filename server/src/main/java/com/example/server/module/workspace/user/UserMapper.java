package com.example.server.module.workspace.user;

import com.example.server.module.workspace.user.dto.NetbirdStatus;
import com.example.server.module.workspace.user.dto.UserRoleInfo;
import com.example.server.module.workspace.user.dto.UserSummary;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Mapper
public interface UserMapper {

    User findById(@Param("userId") UUID userId);

    UserSummary findSummaryById(@Param("userId") UUID userId);

    UserSummary findSummaryByEmail(@Param("email") String email);

    void insertProvisioned(@Param("userId") UUID userId, @Param("fullName") String fullName,
                            @Param("email") String email, @Param("departmentId") UUID departmentId,
                            @Param("roleId") UUID roleId, @Param("zitadelUserId") String zitadelUserId);

    List<UserSummary> findSummaries(@Param("departmentId") UUID departmentId,
                                     @Param("limit") int limit, @Param("offset") int offset);

    long countSummaries(@Param("departmentId") UUID departmentId);

    List<UUID> findUserIdsByDepartment(@Param("departmentId") UUID departmentId);

    NetbirdStatus findNetbirdStatus(@Param("userId") UUID userId);

    UserRoleInfo findRoleInfo(@Param("userId") UUID userId);

    long countActiveAdmins();

    void updateRole(@Param("userId") UUID userId, @Param("roleId") UUID roleId);

    void lock(@Param("userId") UUID userId, @Param("reason") String reason);

    void unlock(@Param("userId") UUID userId);

    void updateAvatar(@Param("userId") UUID userId, @Param("avatarUrl") String avatarUrl);

    void updateStatusByZitadelUserId(@Param("zitadelUserId") String zitadelUserId, @Param("status") String status);

    void updateNetbirdStatusByZitadelUserId(@Param("zitadelUserId") String zitadelUserId,
                                             @Param("connected") boolean connected,
                                             @Param("lastSeen") Instant lastSeen);

    void updateNetbirdStatusByEmail(@Param("email") String email,
                                     @Param("connected") boolean connected,
                                     @Param("lastSeen") Instant lastSeen);
}
