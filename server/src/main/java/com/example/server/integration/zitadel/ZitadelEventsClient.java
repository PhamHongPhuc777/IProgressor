package com.example.server.integration.zitadel;

import java.time.Instant;
import java.util.List;

/** Seam for pulling Zitadel's own identity events (logins, password checks, ...) into the local audit log. */
public interface ZitadelEventsClient {

    /**
     * Only events strictly after `since`, ascending by creationDate. Callers should still dedupe on
     * insert (e.g. via a unique constraint) -- this can miss events if more than the implementation's
     * fetch window land in a single poll interval (see RealZitadelEventsClient).
     */
    List<ZitadelIdentityEvent> fetchIdentityEvents(Instant since);
}
