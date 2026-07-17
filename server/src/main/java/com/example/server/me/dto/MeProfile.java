package com.example.server.me.dto;

import com.example.server.workspace.user.User;

import java.util.Set;

public record MeProfile(User user, String roleName, String departmentName, Set<String> permissions) {
}
