package com.eventos.gallery.integration;

import com.eventos.gallery.config.UserPrincipal;
import com.eventos.gallery.dto.ConfirmUploadDto;
import com.eventos.gallery.dto.CreateAlbumDto;
import com.eventos.gallery.dto.CreateShareLinkDto;
import com.eventos.gallery.dto.SignedUploadRequestDto;
import com.eventos.gallery.entity.GalleryItemType;
import com.eventos.gallery.service.CloudinaryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class GalleryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.eventos.gallery.repository.ShareLinkAccessLogRepository shareLinkAccessLogRepository;

    @MockBean
    private CloudinaryService cloudinaryService;

    @MockBean
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    private UUID tenantId;
    private Authentication ownerAuth;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        
        // Setup Security Context
        UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), tenantId, "owner@eventos.com", "OWNER");
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER"));
        ownerAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(principal, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(ownerAuth);
    }

    @Test
    void testFullAlbumAndGalleryItemAndShareLinkWorkflow() throws Exception {
        CreateAlbumDto createAlbumDto = new CreateAlbumDto();
        createAlbumDto.setName("Summer Wedding 2026");
        createAlbumDto.setDescription("John and Mary's beautiful wedding gallery");
        createAlbumDto.setStatus(com.eventos.gallery.entity.AlbumStatus.PUBLISHED);
        UUID eventId = UUID.randomUUID();
        createAlbumDto.setEventId(eventId);

        MvcResult createAlbumResult = mockMvc.perform(post("/albums")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createAlbumDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Summer Wedding 2026")))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andReturn();

        Map<?, ?> albumResponseMap = objectMapper.readValue(createAlbumResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> albumData = (Map<?, ?>) albumResponseMap.get("data");
        String albumIdStr = (String) albumData.get("id");
        UUID albumId = UUID.fromString(albumIdStr);

        // 2. Get Signed Upload Params
        SignedUploadRequestDto signedDto = new SignedUploadRequestDto();
        signedDto.setAlbumId(albumId);
        signedDto.setName("photo1.jpg");

        Map<String, Object> mockSig = new HashMap<>();
        mockSig.put("signature", "abc123xyz_signature");
        mockSig.put("timestamp", 1718721600L);
        mockSig.put("apiKey", "cloudinary_key");
        mockSig.put("cloudName", "cloudinary_cloud");
        mockSig.put("publicId", "eventos/" + tenantId + "/" + eventId + "/" + albumId + "/photo1");
        mockSig.put("uploadUrl", "https://api.cloudinary.com/v1_1/demo/image/upload");
        when(cloudinaryService.generateUploadSignature(eq(tenantId), eq(albumId), eq(eventId), eq("photo1.jpg"))).thenReturn(mockSig);

        mockMvc.perform(post("/items/signed-upload-params")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signedDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.signature", is("abc123xyz_signature")))
                .andExpect(jsonPath("$.data.publicId", is("eventos/" + tenantId + "/" + eventId + "/" + albumId + "/photo1")));

        // 3. Confirm Upload with category, favorite status, and tags
        ConfirmUploadDto confirmDto = new ConfirmUploadDto();
        confirmDto.setAlbumId(albumId);
        confirmDto.setName("photo1.jpg");
        confirmDto.setUrl("https://res.cloudinary.com/demo/image/upload/photo1.jpg");
        confirmDto.setType(GalleryItemType.IMAGE);
        confirmDto.setPublicId("eventos/" + tenantId + "/" + eventId + "/" + albumId + "/photo1");
        confirmDto.setSize(512000L);
        confirmDto.setFormat("jpg");
        confirmDto.setWidth(1920);
        confirmDto.setHeight(1080);
        confirmDto.setResourceType("image");
        confirmDto.setCategory("Catering");
        confirmDto.setFavorite(true);
        confirmDto.setTags(Set.of("food", "dessert"));

        MvcResult confirmResult = mockMvc.perform(post("/items/confirm-upload")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.url", is("https://res.cloudinary.com/demo/image/upload/photo1.jpg")))
                .andExpect(jsonPath("$.data.size", is(512000)))
                .andExpect(jsonPath("$.data.width", is(1920)))
                .andExpect(jsonPath("$.data.height", is(1080)))
                .andExpect(jsonPath("$.data.resourceType", is("image")))
                .andExpect(jsonPath("$.data.category", is("Catering")))
                .andExpect(jsonPath("$.data.favorite", is(true)))
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andReturn();

        Map<?, ?> itemResponseMap = objectMapper.readValue(confirmResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> itemData = (Map<?, ?>) itemResponseMap.get("data");
        String itemIdStr = (String) itemData.get("id");
        UUID itemId = UUID.fromString(itemIdStr);

        // 3a. Toggle Favorite (set to false)
        mockMvc.perform(patch("/items/" + itemId + "/favorite")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .param("favorite", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.favorite", is(false)));

        // Toggle Favorite (no param -> toggles back to true)
        mockMvc.perform(patch("/items/" + itemId + "/favorite")
                        .with(authentication(ownerAuth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.favorite", is(true)));

        // 3b. Update Organization
        com.eventos.gallery.dto.UpdateOrganizationDto updateOrgDto = new com.eventos.gallery.dto.UpdateOrganizationDto();
        updateOrgDto.setCategory("Decor");
        updateOrgDto.setTags(Set.of("flowers", "lights"));

        mockMvc.perform(put("/items/" + itemId + "/organization")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateOrgDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.category", is("Decor")))
                .andExpect(jsonPath("$.data.tags", hasSize(2)))
                .andExpect(jsonPath("$.data.tags", containsInAnyOrder("flowers", "lights")));

        // 3c. Filter by correct category
        mockMvc.perform(get("/items/album/" + albumId)
                        .with(authentication(ownerAuth))
                        .param("category", "Decor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));

        // Filter by incorrect category
        mockMvc.perform(get("/items/album/" + albumId)
                        .with(authentication(ownerAuth))
                        .param("category", "Catering"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(0)));

        // Filter by correct tag
        mockMvc.perform(get("/items/album/" + albumId)
                        .with(authentication(ownerAuth))
                        .param("tag", "flowers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));

        // Filter by correct favorite
        mockMvc.perform(get("/items/album/" + albumId)
                        .with(authentication(ownerAuth))
                        .param("favorite", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)));

        // 4. Create Share Link with Passcode
        CreateShareLinkDto shareDto = new CreateShareLinkDto();
        shareDto.setAlbumId(albumId);
        shareDto.setPassword("guestPass123");
        shareDto.setExpiresInHours(24);

        MvcResult shareLinkResult = mockMvc.perform(post("/share")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shareDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andExpect(jsonPath("$.data.passwordProtected", is(true)))
                .andReturn();

        Map<?, ?> shareResponseMap = objectMapper.readValue(shareLinkResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> shareData = (Map<?, ?>) shareResponseMap.get("data");
        String token = (String) shareData.get("token");

        // 5. View Shared Album Publicly (Without Passcode -> Expected Forbidden/Passcode Required)
        mockMvc.perform(get("/share/public/view/" + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("PASSCODE_REQUIRED")));

        // 6. View Shared Album Publicly (With Incorrect Passcode -> Expected Forbidden/Invalid Passcode)
        mockMvc.perform(get("/share/public/view/" + token)
                        .param("passcode", "wrongPasscode"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_PASSCODE")));

        // 7. View Shared Album Publicly (With Correct Passcode -> Expected 200 OK)
        mockMvc.perform(get("/share/public/view/" + token)
                        .param("passcode", "guestPass123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Summer Wedding 2026")))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].url", is("https://res.cloudinary.com/demo/image/upload/photo1.jpg")));

        // 8. Bulk ZIP Download
        mockMvc.perform(get("/albums/" + albumId + "/download")
                        .with(authentication(ownerAuth)))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/zip"))
                .andExpect(header().string("Content-Disposition", containsString("Summer Wedding 2026.zip")));

        // 9. Public Guest ZIP Download
        mockMvc.perform(get("/share/public/download/" + token)
                        .param("passcode", "guestPass123"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/zip"))
                .andExpect(header().string("Content-Disposition", containsString("Summer Wedding 2026.zip")));
    }

    @Test
    void testAlbumMetadataStatusVisibilityAndArchiving() throws Exception {
        // 1. Create album with default status/visibility
        CreateAlbumDto createDto = new CreateAlbumDto();
        createDto.setName("Draft Album");
        createDto.setDescription("Draft Description");

        MvcResult createResult = mockMvc.perform(post("/albums")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("DRAFT")))
                .andExpect(jsonPath("$.data.visibility", is("PUBLIC")))
                .andExpect(jsonPath("$.data.coverImage", nullValue()))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) responseMap.get("data");
        UUID albumId = UUID.fromString((String) dataMap.get("id"));

        // 2. Update album status to PUBLISHED, visibility to PRIVATE, and set coverImage
        createDto.setStatus(com.eventos.gallery.entity.AlbumStatus.PUBLISHED);
        createDto.setVisibility(com.eventos.gallery.entity.AlbumVisibility.PRIVATE);
        createDto.setCoverImage("https://res.cloudinary.com/cover.jpg");

        mockMvc.perform(put("/albums/" + albumId)
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")))
                .andExpect(jsonPath("$.data.visibility", is("PRIVATE")))
                .andExpect(jsonPath("$.data.coverImage", is("https://res.cloudinary.com/cover.jpg")));

        // 3. Archive the album
        mockMvc.perform(put("/albums/" + albumId + "/archive")
                        .with(authentication(ownerAuth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("ARCHIVED")));

        // 4. Create a share link for this archived album and try to access it (expect 403 Forbidden / ALBUM_NOT_PUBLISHED)
        CreateShareLinkDto shareDto = new CreateShareLinkDto();
        shareDto.setAlbumId(albumId);
        shareDto.setExpiresInHours(24);

        MvcResult shareLinkResult = mockMvc.perform(post("/share")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shareDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> shareResponse = objectMapper.readValue(shareLinkResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> shareData = (Map<?, ?>) shareResponse.get("data");
        String token = (String) shareData.get("token");

        mockMvc.perform(get("/share/public/view/" + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("ALBUM_NOT_PUBLISHED")))
                .andExpect(jsonPath("$.error.message", containsString("not published")));
    }

    @Test
    void testSecureSharingPermissionsAndAuditing() throws Exception {
        // 1. Create a published album
        CreateAlbumDto createAlbumDto = new CreateAlbumDto();
        createAlbumDto.setName("Audited Wedding");
        createAlbumDto.setDescription("Wedding with secure sharing");
        createAlbumDto.setStatus(com.eventos.gallery.entity.AlbumStatus.PUBLISHED);

        MvcResult createAlbumResult = mockMvc.perform(post("/albums")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createAlbumDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> albumResponseMap = objectMapper.readValue(createAlbumResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> albumData = (Map<?, ?>) albumResponseMap.get("data");
        UUID albumId = UUID.fromString((String) albumData.get("id"));

        // 2. Create secure share link with allowDownload = false, expiresAt 2 days in the future, and password
        CreateShareLinkDto secureShareDto = new CreateShareLinkDto();
        secureShareDto.setAlbumId(albumId);
        secureShareDto.setPassword("securePass123");
        secureShareDto.setAllowDownload(false);
        secureShareDto.setExpiresAt(java.time.Instant.now().plus(2, java.time.temporal.ChronoUnit.DAYS));

        MvcResult secureShareResult = mockMvc.perform(post("/share")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secureShareDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.allowDownload", is(false)))
                .andExpect(jsonPath("$.data.passwordProtected", is(true)))
                .andReturn();

        Map<?, ?> secureShareMap = objectMapper.readValue(secureShareResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> secureShareData = (Map<?, ?>) secureShareMap.get("data");
        String secureToken = (String) secureShareData.get("token");

        // 3. Try to view the shared album without passcode -> Expected Forbidden (PASSCODE_REQUIRED)
        mockMvc.perform(get("/share/public/view/" + secureToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("PASSCODE_REQUIRED")));

        // 4. Try to view with WRONG passcode -> Expected Forbidden (INVALID_PASSCODE)
        mockMvc.perform(get("/share/public/view/" + secureToken)
                        .param("passcode", "wrongPasscode123"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("INVALID_PASSCODE")));

        // 5. View with CORRECT passcode -> Expected 200 OK
        mockMvc.perform(get("/share/public/view/" + secureToken)
                        .param("passcode", "securePass123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 6. Try downloading (should block with 403 Forbidden since allowDownload = false)
        mockMvc.perform(get("/share/public/download/" + secureToken)
                        .param("passcode", "securePass123"))
                .andExpect(status().isForbidden());

        // 7. Verify audit logs in database
        List<com.eventos.gallery.entity.ShareLinkAccessLog> secureLogs = shareLinkAccessLogRepository.findAllByToken(secureToken);
        org.junit.jupiter.api.Assertions.assertFalse(secureLogs.isEmpty(), "Logs should have been recorded");

        // Verify success view log
        boolean hasSuccessLog = secureLogs.stream().anyMatch(log -> log.isSuccess() && log.getFailureReason() == null);
        org.junit.jupiter.api.Assertions.assertTrue(hasSuccessLog, "Should record a successful access log");

        // Verify failed passcode view log
        boolean hasFailedLog = secureLogs.stream().anyMatch(log -> !log.isSuccess() && "INVALID_PASSCODE".equals(log.getFailureReason()));
        org.junit.jupiter.api.Assertions.assertTrue(hasFailedLog, "Should record an invalid passcode access log");

        // Verify passcode required view log
        boolean hasRequiredLog = secureLogs.stream().anyMatch(log -> !log.isSuccess() && "PASSCODE_REQUIRED".equals(log.getFailureReason()));
        org.junit.jupiter.api.Assertions.assertTrue(hasRequiredLog, "Should record a passcode required access log");
    }

    @Test
    void testGalleryAcceptanceWorkflow() throws Exception {
        // Step 1 & 2: Planner creates booking and event (simulated in gallery-service by generating a random eventId)
        UUID eventId = UUID.randomUUID();

        // Step 3: Planner creates album (POST /albums)
        CreateAlbumDto createDto = new CreateAlbumDto();
        createDto.setName("Acceptance Test Album");
        createDto.setDescription("Album for E2E Acceptance Test");
        createDto.setEventId(eventId);
        createDto.setStatus(com.eventos.gallery.entity.AlbumStatus.PUBLISHED);

        MvcResult createResult = mockMvc.perform(post("/albums")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andReturn();

        Map<?, ?> albumResponseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> albumData = (Map<?, ?>) albumResponseMap.get("data");
        UUID albumId = UUID.fromString((String) albumData.get("id"));

        // Step 4: Frontend requests upload signature (POST /items/signed-upload-params)
        SignedUploadRequestDto signatureReq = new SignedUploadRequestDto();
        signatureReq.setAlbumId(albumId);
        signatureReq.setName("acceptance_image.jpg");

        Map<String, Object> mockSig = new HashMap<>();
        mockSig.put("signature", "mock_acceptance_sig");
        mockSig.put("timestamp", 1718721600L);
        mockSig.put("apiKey", "api_key");
        mockSig.put("cloudName", "cloud_name");
        mockSig.put("publicId", "eventos/" + tenantId + "/" + eventId + "/" + albumId + "/acceptance_image");
        mockSig.put("uploadUrl", "https://api.cloudinary.com/v1_1/demo/image/upload");
        when(cloudinaryService.generateUploadSignature(eq(tenantId), eq(albumId), eq(eventId), eq("acceptance_image.jpg"))).thenReturn(mockSig);

        mockMvc.perform(post("/items/signed-upload-params")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signatureReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.publicId", is("eventos/" + tenantId + "/" + eventId + "/" + albumId + "/acceptance_image")));

        // Step 5 & 6: Media uploaded to Cloudinary & Frontend confirms upload (POST /items/confirm-upload)
        ConfirmUploadDto confirmDto = new ConfirmUploadDto();
        confirmDto.setAlbumId(albumId);
        confirmDto.setName("acceptance_image.jpg");
        confirmDto.setUrl("https://res.cloudinary.com/demo/image/upload/acceptance_image.jpg");
        confirmDto.setType(GalleryItemType.IMAGE);
        confirmDto.setPublicId("eventos/" + tenantId + "/" + eventId + "/" + albumId + "/acceptance_image");
        confirmDto.setSize(204800L);
        confirmDto.setFormat("jpg");
        confirmDto.setWidth(800);
        confirmDto.setHeight(600);
        confirmDto.setResourceType("image");

        MvcResult confirmResult = mockMvc.perform(post("/items/confirm-upload")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.url", is("https://res.cloudinary.com/demo/image/upload/acceptance_image.jpg")))
                .andReturn();

        Map<?, ?> itemResponseMap = objectMapper.readValue(confirmResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> itemData = (Map<?, ?>) itemResponseMap.get("data");
        UUID itemId = UUID.fromString((String) itemData.get("id"));

        // Step 7: Planner creates share link (POST /share)
        CreateShareLinkDto shareDto = new CreateShareLinkDto();
        shareDto.setAlbumId(albumId);
        shareDto.setPassword("clientPass123");
        shareDto.setAllowDownload(true);

        MvcResult shareResult = mockMvc.perform(post("/share")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shareDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.token", notNullValue()))
                .andReturn();

        Map<?, ?> shareResponseMap = objectMapper.readValue(shareResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> shareData = (Map<?, ?>) shareResponseMap.get("data");
        String token = (String) shareData.get("token");

        // Step 8: Client accesses gallery (GET /share/public/view/{token})
        mockMvc.perform(get("/share/public/view/" + token)
                        .param("passcode", "clientPass123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.albumId", is(albumId.toString())))
                .andExpect(jsonPath("$.data.items", hasSize(1)));

        // Step 9 & 10: Planner deletes media (DELETE /items/{id}) & Cloudinary cleanup runs asynchronously (verify RabbitMQ event)
        mockMvc.perform(delete("/items/" + itemId)
                        .with(authentication(ownerAuth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Verify that the database record is removed immediately
        mockMvc.perform(get("/items/album/" + albumId)
                        .with(authentication(ownerAuth)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        // Verify that MediaDeletedEvent is published to RabbitMQ asynchronously
        org.mockito.Mockito.verify(rabbitTemplate, org.mockito.Mockito.times(1)).convertAndSend(
                org.mockito.Mockito.eq(com.eventos.gallery.config.MessagingConfig.EXCHANGE),
                org.mockito.Mockito.eq(com.eventos.gallery.config.MessagingConfig.CLEANUP_ROUTING_KEY),
                org.mockito.Mockito.any(com.eventos.gallery.event.MediaDeletedEvent.class)
        );
    }

    @Test
    void testDeleteAlbumWorkflow() throws Exception {
        UUID eventId = UUID.randomUUID();

        // 1. Planner creates album (POST /albums)
        CreateAlbumDto createDto = new CreateAlbumDto();
        createDto.setName("Album to Delete");
        createDto.setDescription("This album will be deleted");
        createDto.setEventId(eventId);
        createDto.setStatus(com.eventos.gallery.entity.AlbumStatus.PUBLISHED);

        MvcResult createResult = mockMvc.perform(post("/albums")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andReturn();

        Map<?, ?> albumResponseMap = objectMapper.readValue(createResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> albumData = (Map<?, ?>) albumResponseMap.get("data");
        UUID albumId = UUID.fromString((String) albumData.get("id"));

        // 2. Planner confirms upload of media item in the album
        ConfirmUploadDto confirmDto = new ConfirmUploadDto();
        confirmDto.setAlbumId(albumId);
        confirmDto.setName("album_deleted_image.jpg");
        confirmDto.setUrl("https://res.cloudinary.com/demo/image/upload/album_deleted_image.jpg");
        confirmDto.setType(GalleryItemType.IMAGE);
        confirmDto.setPublicId("eventos/" + tenantId + "/" + eventId + "/" + albumId + "/album_deleted_image");
        confirmDto.setSize(102400L);
        confirmDto.setFormat("jpg");
        confirmDto.setWidth(800);
        confirmDto.setHeight(600);
        confirmDto.setResourceType("image");

        MvcResult confirmResult = mockMvc.perform(post("/items/confirm-upload")
                        .with(authentication(ownerAuth))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andReturn();

        Map<?, ?> itemResponseMap = objectMapper.readValue(confirmResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> itemData = (Map<?, ?>) itemResponseMap.get("data");
        UUID itemId = UUID.fromString((String) itemData.get("id"));

        // 3. Planner deletes the album (DELETE /albums/{id})
        mockMvc.perform(delete("/albums/" + albumId)
                        .with(authentication(ownerAuth))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("deleted successfully")));

        // Commit transaction to trigger the AFTER_COMMIT event listener
        if (org.springframework.test.context.transaction.TestTransaction.isActive()) {
            org.springframework.test.context.transaction.TestTransaction.flagForCommit();
            org.springframework.test.context.transaction.TestTransaction.end();
        }

        // 4. Verify that the album is removed immediately from DB (GET /albums/{id} -> 404)
        mockMvc.perform(get("/albums/" + albumId)
                        .with(authentication(ownerAuth)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        // 5. Verify that the associated items are removed immediately from DB (GET /items/album/{id} -> 404)
        mockMvc.perform(get("/items/album/" + albumId)
                        .with(authentication(ownerAuth)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        // 6. Verify that MediaDeletedEvent is published to RabbitMQ asynchronously for album items
        org.mockito.Mockito.verify(rabbitTemplate, org.mockito.Mockito.atLeastOnce()).convertAndSend(
                org.mockito.Mockito.eq(com.eventos.gallery.config.MessagingConfig.EXCHANGE),
                org.mockito.Mockito.eq(com.eventos.gallery.config.MessagingConfig.CLEANUP_ROUTING_KEY),
                org.mockito.Mockito.any(com.eventos.gallery.event.MediaDeletedEvent.class)
        );
    }
}
