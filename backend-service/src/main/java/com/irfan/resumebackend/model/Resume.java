
package com.irfan.resumebackend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "resumes")
@Data
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    
    @Column(columnDefinition = "TEXT")
    private String extractedText;

    private String predictedDepartment;
    private Double confidenceScore;
    private LocalDateTime uploadedAt;
}