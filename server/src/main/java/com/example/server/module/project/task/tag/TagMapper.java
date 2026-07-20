package com.example.server.module.project.task.tag;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.UUID;

@Mapper
public interface TagMapper {

    Tag findByName(@Param("name") String name);

    Tag findById(@Param("tagId") UUID tagId);

    void insert(@Param("tagId") UUID tagId, @Param("name") String name);
}
