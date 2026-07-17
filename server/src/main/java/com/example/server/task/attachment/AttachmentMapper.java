package com.example.server.task.attachment;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.UUID;

@Mapper
public interface AttachmentMapper {

    List<Attachment> findByTask(@Param("taskId") UUID taskId);

    Attachment findById(@Param("attachmentId") UUID attachmentId);

    void insert(@Param("attachmentId") UUID attachmentId, @Param("taskId") UUID taskId, @Param("projectId") UUID projectId,
                @Param("storageType") String storageType, @Param("sharepointItemId") String sharepointItemId,
                @Param("url") String url, @Param("uploadedBy") UUID uploadedBy);

    void delete(@Param("attachmentId") UUID attachmentId);
}
