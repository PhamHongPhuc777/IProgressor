package com.example.server.module.workspace.role;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface RoleMapper {

    List<Role> findAll();

    Role findById(@Param("roleId") UUID roleId);

    Role findByName(@Param("name") String name);

    List<Permission> findAllPermissions();

    List<Permission> findPermissionsForRole(@Param("roleId") UUID roleId);

    void grantPermissions(@Param("roleId") UUID roleId, @Param("permissionIds") List<UUID> permissionIds);

    void revokePermissions(@Param("roleId") UUID roleId, @Param("permissionIds") List<UUID> permissionIds);
}
