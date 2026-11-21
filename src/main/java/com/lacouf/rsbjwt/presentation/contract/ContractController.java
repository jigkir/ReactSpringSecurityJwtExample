package com.lacouf.rsbjwt.presentation.contract;

import com.lacouf.rsbjwt.exception.contract.ContractAlreadySignedException;
import com.lacouf.rsbjwt.exception.contract.ContractNotFoundException;
import com.lacouf.rsbjwt.exception.signature.IncorrectSignaturePasswordException;
import com.lacouf.rsbjwt.exception.session.AcademicSessionNotFoundException;
import com.lacouf.rsbjwt.exception.user.UserNotFoundException;
import com.lacouf.rsbjwt.model.document.DocumentLanguage;
import com.lacouf.rsbjwt.service.contract.ContractService;
import com.lacouf.rsbjwt.service.dto.request.signature.SignatureRequestDto;
import com.lacouf.rsbjwt.service.dto.response.contract.ContractResponseDto;
import com.lacouf.rsbjwt.service.dto.response.document.DocumentFileResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
public class ContractController {
    private final ContractService contractService;

    public ContractController(ContractService contractService) {
        this.contractService = contractService;
    }

    @GetMapping("")
    public ResponseEntity<List<ContractResponseDto>> getContracts(Authentication authentication, @RequestParam(required = false) Long sessionId) throws AcademicSessionNotFoundException, UserNotFoundException {
        return ResponseEntity.ok(contractService.getContracts(authentication.getName(), sessionId));
    }

    @GetMapping("/to-sign")
    public ResponseEntity<List<ContractResponseDto>> getContractsToSign(Authentication authentication) throws UserNotFoundException {
        return ResponseEntity.ok(contractService.getContractsToSign(authentication.getName()));
    }

    @PutMapping("/{contractId}/signature")
    public ResponseEntity<ContractResponseDto> signContract(Authentication authentication, @PathVariable long contractId, @Valid @RequestBody SignatureRequestDto signature) throws UserNotFoundException, IncorrectSignaturePasswordException, ContractNotFoundException, ContractAlreadySignedException {
        return ResponseEntity.ok(contractService.signContract(authentication.getName(), contractId, signature.password()));
    }

    @GetMapping("/{contractId}/file")
    public ResponseEntity<DocumentFileResponseDto> getContractFile(Authentication authentication, @PathVariable long contractId, @RequestParam DocumentLanguage language) throws ContractNotFoundException, UserNotFoundException {
        return ResponseEntity.ok(contractService.getContractFile(authentication.getName(), contractId, language));
    }
}
