package com.example.server.architecture;

import com.tngtech.archunit.core.domain.Dependency;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.ConditionEvents;
import com.tngtech.archunit.lang.SimpleConditionEvent;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

/**
 * Enforces the module-boundary rule documented in ARCHITECTURE.md: a *Mapper (the persistence
 * layer of a domain package) may only be depended on by classes in that same package. Anything
 * that needs data owned by another module must go through that module's Service, not its Mapper
 * directly -- Service is the module's public API, Mapper is its private internals.
 *
 * Pure bytecode analysis, no Spring context -- runs without a database.
 */
class ModularityTest {

    private static final JavaClasses CLASSES = new ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages("com.example.server");

    @Test
    void mappers_are_only_depended_on_from_within_their_own_package() {
        ArchRule rule = classes()
            .that().haveSimpleNameEndingWith("Mapper")
            .should(onlyBeDependedOnFromOwnPackage());

        rule.check(CLASSES);
    }

    private static ArchCondition<JavaClass> onlyBeDependedOnFromOwnPackage() {
        return new ArchCondition<JavaClass>("only be depended on from within their own package") {
            @Override
            public void check(JavaClass mapperClass, ConditionEvents events) {
                String ownPackage = mapperClass.getPackageName();
                for (Dependency dependency : mapperClass.getDirectDependenciesToSelf()) {
                    JavaClass origin = dependency.getOriginClass();
                    if (origin.equals(mapperClass)) {
                        continue;
                    }
                    boolean satisfied = origin.getPackageName().equals(ownPackage);
                    events.add(new SimpleConditionEvent(dependency, satisfied, dependency.getDescription()));
                }
            }
        };
    }
}
