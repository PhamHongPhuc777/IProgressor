package com.example.server;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// annotationClass restricts scanning to @Mapper interfaces -- without it, MapperScan treats every
// interface in the package tree as a mapper (it wrapped DocumentStorageClient/
// ZitadelProvisioningClient as spurious MyBatis proxies, colliding with their real @Component impls).
@SpringBootApplication
@MapperScan(value = "com.example.server", annotationClass = Mapper.class)
@EnableScheduling
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

}
