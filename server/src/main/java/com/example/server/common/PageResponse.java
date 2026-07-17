package com.example.server.common;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean last
) {

    public static <T> PageResponse<T> of(List<T> content, PageRequest request, long totalElements) {
        int totalPages = request.size() == 0 ? 0 : (int) Math.ceil((double) totalElements / request.size());
        boolean last = request.page() >= totalPages - 1;
        return new PageResponse<>(content, request.page(), request.size(), totalElements, totalPages, last);
    }

    public <R> PageResponse<R> map(Function<T, R> mapper) {
        return new PageResponse<>(content.stream().map(mapper).toList(), page, size, totalElements, totalPages, last);
    }
}
