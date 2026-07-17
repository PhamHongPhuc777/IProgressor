package com.example.server.security;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface SecurityMapper {

    AuthUserRow findAuthUserByZitadelUserId(@Param("zitadelUserId") String zitadelUserId);

    List<String> findPermissionKeysByRoleId(@Param("roleId") UUID roleId);
}
