package com.example.server.integration.netbird;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Profile("dev")
public class DevNetBirdClient implements NetBirdClient {

    private static final Logger log = LoggerFactory.getLogger(DevNetBirdClient.class);

    @Override
    public void addUserToGroup(String zitadelUserId, UUID departmentId) {
        log.info("DEV NetBird stub: would add user {} to department {}'s NetBird group", zitadelUserId, departmentId);
    }

    @Override
    public void removeUserFromGroup(String zitadelUserId, UUID departmentId) {
        log.info("DEV NetBird stub: would remove user {} from department {}'s NetBird group", zitadelUserId, departmentId);
    }
}
