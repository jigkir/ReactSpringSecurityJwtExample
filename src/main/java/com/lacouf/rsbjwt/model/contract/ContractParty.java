package com.lacouf.rsbjwt.model.contract;

import com.lacouf.rsbjwt.model.notification.NotificationType;

public enum ContractParty {
    STUDENT(NotificationType.CONTRACT_TO_SIGN_BY_STUDENT),
    EMPLOYER(NotificationType.CONTRACT_TO_SIGN_BY_EMPLOYER),
    MANAGER(NotificationType.CONTRACT_TO_SIGN_BY_MANAGER);

    private final NotificationType contractToSignNotification;

    ContractParty(NotificationType contractToSignNotification) {
        this.contractToSignNotification = contractToSignNotification;
    }

    public NotificationType getContractToSignNotification() {
        return contractToSignNotification;
    }
}
