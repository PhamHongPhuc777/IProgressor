// One module, not two: notification/notification and notification/broadcast call into each
// other (NotificationController delegates to BroadcastService; BroadcastService calls back into
// NotificationService.notifyDepartment) -- see ARCHITECTURE.md's request trace #2. Splitting them
// into separate ApplicationModules would be a real dependency cycle, which Modulith rejects.
@org.springframework.modulith.ApplicationModule
package com.example.server.module.message;
