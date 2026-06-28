package com.eventos.crm.service;

import com.eventos.crm.dto.CreateContactDto;
import com.eventos.crm.entity.Contact;
import com.eventos.crm.repository.ContactRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ContactService {

    private final ContactRepository contactRepository;

    public ContactService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @Transactional(readOnly = true)
    public List<Contact> getAllContacts(UUID tenantId) {
        return contactRepository.findAllByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public Page<Contact> getContacts(UUID tenantId, String query, Pageable pageable) {
        if (query != null && !query.trim().isEmpty()) {
            return contactRepository.searchContacts(tenantId, query.trim(), pageable);
        }
        return contactRepository.findAllByTenantIdAndIsDeletedFalse(tenantId, pageable);
    }

    @Transactional(readOnly = true)
    public Contact getContactById(UUID id, UUID tenantId) {
        return contactRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Contact not found or access denied"));
    }

    @Transactional(readOnly = true)
    public Contact getContactByEmail(String email, UUID tenantId) {
        return contactRepository.findByEmailIgnoreCaseAndTenantIdAndIsDeletedFalse(email, tenantId).orElse(null);
    }

    public Contact createContact(CreateContactDto dto, UUID tenantId) {
        if (dto.getEmail() != null && !dto.getEmail().isEmpty()) {
            Contact existing = getContactByEmail(dto.getEmail(), tenantId);
            if (existing != null) {
                throw new IllegalArgumentException("Contact with this email already exists: " + dto.getEmail());
            }
        }

        Contact contact = Contact.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .companyName(dto.getCompanyName())
                .build();
        contact.setTenantId(tenantId);

        return contactRepository.save(contact);
    }

    public Contact updateContact(UUID id, CreateContactDto dto, UUID tenantId) {
        Contact contact = getContactById(id, tenantId);

        if (dto.getEmail() != null && !dto.getEmail().equalsIgnoreCase(contact.getEmail())) {
            Contact existing = getContactByEmail(dto.getEmail(), tenantId);
            if (existing != null && !existing.getId().equals(id)) {
                throw new IllegalArgumentException("Contact with this email already exists: " + dto.getEmail());
            }
        }

        contact.setFirstName(dto.getFirstName());
        contact.setLastName(dto.getLastName());
        contact.setEmail(dto.getEmail());
        contact.setPhone(dto.getPhone());
        contact.setCompanyName(dto.getCompanyName());

        return contactRepository.save(contact);
    }

    public void deleteContact(UUID id, UUID tenantId) {
        Contact contact = getContactById(id, tenantId);
        contact.setDeleted(true);
        contactRepository.save(contact);
    }
    
    public Contact getOrCreateContact(String firstName, String lastName, String email, String phone, UUID tenantId) {
        if (email != null && !email.trim().isEmpty()) {
            Contact existing = getContactByEmail(email.trim(), tenantId);
            if (existing != null) {
                return existing;
            }
        }
        
        Contact contact = Contact.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .phone(phone)
                .build();
        contact.setTenantId(tenantId);
        return contactRepository.save(contact);
    }
}
