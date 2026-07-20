package com.example.server.task.comment;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface CommentMapper {

    List<Comment> findByTask(@Param("taskId") UUID taskId);

    void insert(@Param("commentId") UUID commentId, @Param("taskId") UUID taskId,
                @Param("authorId") UUID authorId, @Param("content") String content);

    Comment findById(@Param("commentId") UUID commentId);
}
