package com.eventos.auth.service;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PermissionService {

    public List<Map<String, String>> getAvailablePermissions() {
        List<Map<String, String>> permissions = new ArrayList<>();
        
        addPermission(permissions, "dashboard:read", "Dashboard View", "Access main KPI dashboard reports");
        addPermission(permissions, "crm:read", "Read Leads", "View inquiries and CRM database profiles");
        addPermission(permissions, "crm:write", "Manage Leads", "Create and edit CRM customer inquiries");
        addPermission(permissions, "quotes:read", "Read Quotes", "View proposals and calculator estimates");
        addPermission(permissions, "quotes:write", "Manage Quotes", "Create and edit quotes and proposals");
        addPermission(permissions, "bookings:read", "Read Bookings", "View confirmed client bookings");
        addPermission(permissions, "bookings:write", "Manage Bookings", "Create, edit, or cancel confirmed bookings");
        addPermission(permissions, "events:read", "Read Events", "Access logistical calendars and task schedules");
        addPermission(permissions, "events:write", "Manage Events", "Create and assign logistical coordinators");
        addPermission(permissions, "payments:read", "Read Payments", "View transaction logs and payments status");
        addPermission(permissions, "invoices:read", "Read Invoices", "View billing ledger records");
        addPermission(permissions, "gallery:read", "Read Galleries", "View client photography shared media");
        addPermission(permissions, "gallery:write", "Manage Galleries", "Upload, clean, and share media portfolios");
        addPermission(permissions, "settings:read", "Read Settings", "View company configuration workspace");
        addPermission(permissions, "settings:write", "Manage Settings", "Edit billing, keys, and security setups");
        addPermission(permissions, "analytics:read", "Read Analytics", "View detailed accounting and usage stats");
        addPermission(permissions, "export:data", "Export Data", "Download full system database or lead tables");
        addPermission(permissions, "delete:data", "Dangerous Delete", "Remove confirmed events or active accounts");

        return permissions;
    }

    private void addPermission(List<Map<String, String>> list, String code, String name, String desc) {
        Map<String, String> perm = new HashMap<>();
        perm.put("code", code);
        perm.put("name", name);
        perm.put("description", desc);
        list.add(perm);
    }
}
