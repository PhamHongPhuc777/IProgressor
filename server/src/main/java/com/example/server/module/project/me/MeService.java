package com.example.server.module.project.me;

import com.example.server.module.project.me.dto.MeProfile;
import com.example.server.module.project.me.dto.MyStats;
import com.example.server.security.AuthenticatedUser;
import com.example.server.security.CurrentUser;
import com.example.server.module.workspace.department.DepartmentService;
import com.example.server.module.workspace.role.RoleService;
import com.example.server.module.workspace.user.User;
import com.example.server.module.workspace.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MeService {

    private final UserService userService;
    private final RoleService roleService;
    private final DepartmentService departmentService;
    private final MeStatsMapper meStatsMapper;

    public MeProfile getProfile() {
        AuthenticatedUser actor = CurrentUser.get();
        return toProfile(userService.getUser(actor.userId()), actor);
    }

    public MeProfile updateAvatar(String avatarUrl) {
        AuthenticatedUser actor = CurrentUser.get();
        return toProfile(userService.updateAvatar(actor.userId(), avatarUrl), actor);
    }

    public MyStats getStats() {
        return meStatsMapper.findStats(CurrentUser.get().userId());
    }

    private MeProfile toProfile(User user, AuthenticatedUser actor) {
        String roleName = roleService.getById(user.roleId()).name();
        String departmentName = departmentService.getById(user.departmentId()).name();
        return new MeProfile(user, roleName, departmentName, actor.permissions());
    }
}
