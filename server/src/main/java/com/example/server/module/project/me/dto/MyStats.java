package com.example.server.module.project.me.dto;

public record MyStats(long assignedTaskCount, long completedTaskCount, long overdueTaskCount, long inProgressTaskCount) {
}
