package com.lacouf.rsbjwt.repository.document;

import com.lacouf.rsbjwt.model.documents.Document;
import com.lacouf.rsbjwt.model.documents.DocumentVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.util.List;
import java.util.Optional;

@NoRepositoryBean
public interface DocumentRepository<T extends Document> extends JpaRepository<T, Long> {

    Optional<T> findByIdAndUser_Credentials_Email(long id, String email);

    List<T> findByUser_Credentials_EmailAndVisibility(String email, DocumentVisibility visibility);
}
