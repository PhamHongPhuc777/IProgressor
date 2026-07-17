package com.example.server.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;
import java.util.UUID;

/**
 * Manual MyBatis wiring -- mybatis-spring-boot-starter's own autoconfiguration (built for Spring
 * Boot 3.x) doesn't produce a SqlSessionFactory bean under this project's Spring Boot 4.1.0, so
 * mapper beans created by @MapperScan (see ServerApplication) had nothing to attach to. This
 * replaces that autoconfiguration with the same effect: mybatis.mapper-locations and
 * mybatis.configuration.map-underscore-to-camel-case are handled explicitly below instead of via
 * application.yml.
 */
@Configuration
public class MyBatisConfig {

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        factoryBean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:mapper/**/*.xml"));

        org.apache.ibatis.session.Configuration configuration = new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        // Not auto-registered in this MyBatis/Boot combination -- every mapper resultMap uses UUID PKs/FKs.
        configuration.getTypeHandlerRegistry().register(UUID.class, new UuidTypeHandler());
        factoryBean.setConfiguration(configuration);

        return factoryBean.getObject();
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
