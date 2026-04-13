package com.irfan.resumebackend.service;

import com.irfan.resumebackend.model.AiResponse;
import com.irfan.resumebackend.model.Resume;
import com.irfan.resumebackend.repository.ResumeRepository;
import com.fasterxml.jackson.databind.ObjectMapper; // Wajib import
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.Tika;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class ResumeService {

    @Autowired
    private ResumeRepository resumeRepository;

    // Tambah ObjectMapper supaya kita boleh convert list ke String
    private final ObjectMapper objectMapper = new ObjectMapper(); 
    
    private final Tika tika = new Tika();
    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_SERVICE_URL = "http://localhost:8000/classify";

    public AiResponse processResume(MultipartFile file) throws Exception {
        // 1. Extract Text
        String extractedText = tika.parseToString(file.getInputStream());
        
        // 2. Call Python AI
        AiResponse response = restTemplate.postForObject(PYTHON_SERVICE_URL, Map.of("text", extractedText), AiResponse.class);

        // 3. Save to DB
        if (response != null) {
            Resume resume = new Resume();
            resume.setFileName(file.getOriginalFilename());
            resume.setExtractedText(extractedText);
            resume.setPredictedDepartment(response.getTop_prediction().getDepartment());
            resume.setConfidenceScore(response.getTop_prediction().getConfidence());
            
            // --- BAHAGIAN BARU: Simpan list penuh ke String ---
            String jsonContent = objectMapper.writeValueAsString(response.getAll_predictions());
            resume.setAllPredictionsJson(jsonContent);
            // --------------------------------------------------

            resume.setUploadedAt(LocalDateTime.now());
            resumeRepository.save(resume);
        }

        return response;
    }
}