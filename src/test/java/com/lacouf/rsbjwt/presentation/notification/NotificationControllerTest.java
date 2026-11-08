package com.lacouf.rsbjwt.presentation.notification;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.service.notification.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Import(GlobalExceptionHandler.class)
@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;
    @MockitoBean
    private ReactSpringSecurityJwtApplication application;

    private final Authentication authentication = new UsernamePasswordAuthenticationToken("student@example.com", null);

    @Test
    void shouldReturnNoContentWhenMarkingNotificationsAsRead() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/notifications/read").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notificationIds\": [1, 2]}"))
                .andExpect(status().isNoContent());

        verify(notificationService).markAsRead("student@example.com", List.of(1L, 2L));
    }

    @Test
    void shouldReturnBadRequestWhenNoNotificationIsGiven() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/notifications/read").principal(authentication)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notificationIds\": []}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(notificationService);
    }

    @Test
    void shouldReturnUnreadNotificationsOfConnectedUser() throws Exception {
        // Arrange
        NotificationDto notification = new NotificationDto(5L, "CV Approved", "Your CV has been approved.",
                NotificationStatus.UNREAD, TargetType.CV, NotificationType.CV_APPROVED, 1L, LocalDateTime.now());

        when(notificationService.getUnreadNotifications("student@example.com")).thenReturn(List.of(notification));

        // Act + Assert
        mockMvc.perform(get("/api/notifications").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5))
                .andExpect(jsonPath("$[0].notificationType").value("CV_APPROVED"))
                .andExpect(jsonPath("$[0].targetId").value(1));

        verify(notificationService).getUnreadNotifications("student@example.com");
    }
}
