package com.example.server.module.project.me.dto;

import com.example.server.module.workspace.user.User;

import java.util.Set;

public record MeProfile(User user, String roleName, String departmentName, Set<String> permissions) {
}
