package com.example.server.me.dto;

public record MyStats(long assignedTaskCount, long completedTaskCount, long overdueTaskCount, long inProgressTaskCount) {
}
