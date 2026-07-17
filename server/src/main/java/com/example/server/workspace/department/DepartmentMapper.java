package com.example.server.workspace.department;

import com.example.server.workspace.department.dto.DepartmentPerformance;
import com.example.server.workspace.department.dto.WorkloadEntry;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface DepartmentMapper {

    List<Department> findAll();

    Department findById(@Param("departmentId") UUID departmentId);

    void updateZitadelOrgId(@Param("departmentId") UUID departmentId, @Param("zitadelOrgId") String zitadelOrgId);

    void updateNetbirdGroupId(@Param("departmentId") UUID departmentId, @Param("netbirdGroupId") String netbirdGroupId);

    List<WorkloadEntry> findWorkload(@Param("departmentId") UUID departmentId);

    DepartmentPerformance findPerformance(@Param("departmentId") UUID departmentId);
}
