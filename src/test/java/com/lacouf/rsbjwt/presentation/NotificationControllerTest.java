package com.lacouf.rsbjwt.presentation;

import com.lacouf.rsbjwt.ReactSpringSecurityJwtApplication;
import com.lacouf.rsbjwt.exception.GlobalExceptionHandler;
import com.lacouf.rsbjwt.model.notification.NotificationStatus;
import com.lacouf.rsbjwt.model.notification.NotificationType;
import com.lacouf.rsbjwt.model.notification.TargetType;
import com.lacouf.rsbjwt.service.NotificationService;
import com.lacouf.rsbjwt.service.dto.response.notification.NotificationDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
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
    void shouldReturnNoContentWhenMarkingTargetTypeAsRead() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/notifications/read/CV").principal(authentication))
                .andExpect(status().isNoContent());

        verify(notificationService).markAllAsReadByTargetType("student@example.com", TargetType.CV);
    }

    @Test
    void shouldReturnBadRequestWhenTargetTypeIsInvalid() throws Exception {
        // Act + Assert
        mockMvc.perform(put("/api/notifications/read/UNKNOWN").principal(authentication))
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

    @Test
    void shouldReturnUnreadCountWhenCountingByType() throws Exception {
        // Arrange
        when(notificationService.countUnread("student@example.com", NotificationType.NEW_INTERNSHIP_OFFER)).thenReturn(3L);

        // Act + Assert
        mockMvc.perform(get("/api/notifications/unread/count/NEW_INTERNSHIP_OFFER").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(content().string("3"));

        verify(notificationService).countUnread("student@example.com", NotificationType.NEW_INTERNSHIP_OFFER);
    }
}
