package com.irfan.resumebackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ResumebackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResumebackendApplication.class, args);
	}

}
