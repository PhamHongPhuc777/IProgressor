package com.example.server.architecture;

import com.example.server.ServerApplication;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/**
 * Verifies the domain packages under module/workspace/* and module/project/* form a valid set of
 * Spring Modulith application modules: no cycles between modules, and no module reaching into
 * another module's internal (non-API, non-@NamedInterface) packages. See each domain package's
 * package-info.java for its @ApplicationModule/@NamedInterface declarations.
 *
 * This is broader than -- and complements, not replaces -- ModularityTest's narrower "Mappers are
 * only used within their own package" rule: Controller/Service/Model/Mapper sit as flat siblings
 * in each domain's root package by this codebase's convention (see ARCHITECTURE.md), so they're
 * all part of a module's default API as far as Modulith is concerned. ModularityTest still catches
 * cross-module Mapper access specifically; this test catches cross-module cycles and reaching into
 * dto/ (or any other) sub-package without a declared @NamedInterface.
 */
class ApplicationModuleArrangementTest {

    private static final ApplicationModules MODULES = ApplicationModules.of(ServerApplication.class);

    @Test
    void isValid() {
        MODULES.verify();
    }
}
