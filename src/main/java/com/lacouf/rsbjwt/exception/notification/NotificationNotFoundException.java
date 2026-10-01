package com.lacouf.rsbjwt.exception.notification;

import com.lacouf.rsbjwt.exception.APIException;
import org.springframework.http.HttpStatus;

public class NotificationNotFoundException extends APIException {
    public NotificationNotFoundException(long notificationId) {
        super(HttpStatus.NOT_FOUND, "Notification not found with ID: " + notificationId);
    }
}
