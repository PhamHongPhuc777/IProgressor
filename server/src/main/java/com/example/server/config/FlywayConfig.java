package com.example.server.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.Map;

/**
 * Manual Flyway wiring -- Spring Boot's own FlywayAutoConfiguration (like MyBatis's, see
 * MyBatisConfig) doesn't activate under this project's Spring Boot 4.1.0, so migrations were
 * silently never running (confirmed: first real query hit "relation \"users\" does not exist" --
 * HikariCP's own pool is lazy and only connects on first use, which is why this stayed invisible
 * at startup). This runs migrate() eagerly as a singleton bean, before Tomcat accepts any request.
 */
@Configuration
public class FlywayConfig {

    @Value("${app.admin-bootstrap.zitadel-user-id}")
    private String adminZitadelUserId;

    @Value("${app.admin-bootstrap.email}")
    private String adminEmail;

    @Value("${app.admin-bootstrap.full-name}")
    private String adminFullName;

    @Value("${app.admin-bootstrap.department-name}")
    private String adminDepartmentName;

    @Bean
    public Flyway flyway(DataSource dataSource) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .placeholders(Map.of(
                "adminZitadelUserId", adminZitadelUserId,
                "adminEmail", adminEmail,
                "adminFullName", adminFullName,
                "adminDepartmentName", adminDepartmentName
            ))
            .load();
        flyway.migrate();
        return flyway;
    }
}
