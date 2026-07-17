package com.example.server.common;

public record PageRequest(int page, int size, String sortBy, String sortDir) {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    public static PageRequest of(Integer page, Integer size, String sort) {
        int safePage = (page == null || page < 0) ? 0 : page;
        int safeSize = (size == null || size < 1) ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);

        String sortBy = "created_at";
        String sortDir = "desc";
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            sortBy = parts[0].trim();
            if (parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc")) {
                sortDir = "asc";
            }
        }
        return new PageRequest(safePage, safeSize, sortBy, sortDir);
    }

    public int offset() {
        return page * size;
    }

    /**
     * MyBatis ORDER BY clauses can't be parameter-bound, so any sortBy value that reaches raw SQL
     * must first be checked against a query-specific whitelist to prevent SQL injection.
     */
    public String sortColumnOrDefault(java.util.Set<String> allowedColumns, String fallback) {
        return allowedColumns.contains(sortBy) ? sortBy : fallback;
    }
}
