package com.eventos.gallery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class GalleryApplication {
    public static void main(String[] args) {
        SpringApplication.run(GalleryApplication.class, args);
    }
}
