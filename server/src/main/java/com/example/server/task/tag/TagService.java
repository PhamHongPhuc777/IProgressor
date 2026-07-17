package com.example.server.task.tag;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagMapper tagMapper;

    public Tag findOrCreate(String name) {
        Tag tag = tagMapper.findByName(name);
        if (tag != null) {
            return tag;
        }
        UUID tagId = UUID.randomUUID();
        tagMapper.insert(tagId, name);
        return new Tag(tagId, name);
    }
}
