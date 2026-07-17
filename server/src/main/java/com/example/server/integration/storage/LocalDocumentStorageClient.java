package com.example.server.integration.storage;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Component
@Profile("dev")
public class LocalDocumentStorageClient implements DocumentStorageClient {

    private static final Path UPLOAD_DIR = Path.of("uploads");

    @Override
    public StoredFile store(MultipartFile file, String context) {
        try {
            Files.createDirectories(UPLOAD_DIR);
            String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
            String filename = UUID.randomUUID() + "-" + original;
            file.transferTo(UPLOAD_DIR.resolve(filename));
            return new StoredFile("LOCAL", null, "/uploads/" + filename);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store file locally", e);
        }
    }
}
