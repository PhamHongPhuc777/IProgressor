package com.example.server.security;

import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Zitadel issues the JWT; this converter resolves it to our own USER row (department/role) on every
 * request rather than trusting claims embedded in the token, so an admin-edited ROLE_PERMISSION
 * matrix or a lock/role-change takes effect immediately without waiting on token expiry.
 */
@Component
@RequiredArgsConstructor
public class LocalUserJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final SecurityMapper securityMapper;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String zitadelUserId = jwt.getSubject();
        AuthUserRow row = securityMapper.findAuthUserByZitadelUserId(zitadelUserId);
        if (row == null) {
            throw new InvalidBearerTokenException("No local account provisioned for this identity");
        }
        if ("LOCKED".equals(row.status())) {
            throw new InvalidBearerTokenException("Account is locked");
        }

        Set<String> permissionKeys = new HashSet<>(securityMapper.findPermissionKeysByRoleId(row.roleId()));
        AuthenticatedUser principal = new AuthenticatedUser(
            row.userId(), row.departmentId(), row.roleId(), row.roleName(),
            row.fullName(), row.email(), permissionKeys
        );

        Collection<GrantedAuthority> authorities = permissionKeys.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toSet());

        return new AppAuthenticationToken(principal, jwt, authorities);
    }
}
