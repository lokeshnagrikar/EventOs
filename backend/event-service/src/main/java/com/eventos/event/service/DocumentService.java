package com.eventos.event.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DocumentService {

    public List<Map<String, Object>> getDocuments(String clientEmail, UUID tenantId) {
        List<Map<String, Object>> documents = new ArrayList<>();

        Map<String, Object> doc1 = new HashMap<>();
        doc1.put("id", UUID.randomUUID().toString());
        doc1.put("name", "Event_Decoration_Moodboard.pdf");
        doc1.put("type", "DESIGN");
        doc1.put("size", "3.4 MB");
        doc1.put("createdAt", LocalDateTime.now().minusDays(10));
        doc1.put("downloadUrl", "/api/v1/client/documents/download/1");
        documents.add(doc1);

        Map<String, Object> doc2 = new HashMap<>();
        doc2.put("id", UUID.randomUUID().toString());
        doc2.put("name", "Vendor_Contact_List.pdf");
        doc2.put("type", "VENDOR");
        doc2.put("size", "820 KB");
        doc2.put("createdAt", LocalDateTime.now().minusDays(5));
        doc2.put("downloadUrl", "/api/v1/client/documents/download/2");
        documents.add(doc2);

        Map<String, Object> doc3 = new HashMap<>();
        doc3.put("id", UUID.randomUUID().toString());
        doc3.put("name", "Signed_Event_Contract.pdf");
        doc3.put("type", "CONTRACT");
        doc3.put("size", "2.1 MB");
        doc3.put("createdAt", LocalDateTime.now().minusDays(15));
        doc3.put("downloadUrl", "/api/v1/client/documents/download/3");
        documents.add(doc3);

        return documents;
    }
}
