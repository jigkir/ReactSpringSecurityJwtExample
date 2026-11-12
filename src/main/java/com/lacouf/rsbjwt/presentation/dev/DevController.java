package com.lacouf.rsbjwt.presentation.dev;

import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.contract.ContractNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.service.dto.response.auth.JWTAuthResponse;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.user.UserResponseDto;
import com.lacouf.rsbjwt.service.users.ManagerService;
import com.lacouf.rsbjwt.service.users.UserAppService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dev")
public class DevController {
    private final UserAppService userAppService;
    private final ManagerService managerService;

    public DevController(UserAppService userAppService, ManagerService managerService) {
        this.userAppService = userAppService;
        this.managerService = managerService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userAppService.getAllDevUsers());
    }

    @PostMapping("/login-as")
    public ResponseEntity<JWTAuthResponse> loginAs(@RequestParam String email) throws UserNotFoundException {
        return ResponseEntity.ok(userAppService.devLoginAs(email));
    }

    @PutMapping("/contracts/{contractId}/manager-signature")
    public ResponseEntity<ContractResponseDto> signContractAsManager(@PathVariable long contractId, @RequestParam String email) throws UserNotFoundException, ContractNotFoundException, ContractAlreadySignedException {
        return ResponseEntity.ok(managerService.devSignContract(email, contractId));
    }
}