package com.irfan.resumebackend.service;

import com.irfan.resumebackend.model.AiResponse;
import com.irfan.resumebackend.model.Resume;
import com.irfan.resumebackend.repository.ResumeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async; // Wajib ada
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

    private final ObjectMapper objectMapper = new ObjectMapper(); 
    private final Tika tika = new Tika();
    private final RestTemplate restTemplate = new RestTemplate();
    private final String PYTHON_SERVICE_URL = "http://localhost:8000/classify";

    // LANGKAH 1: Simpan rekod kosong dulu supaya user nampak kat table
    public Resume saveInitial(MultipartFile file) {
        Resume resume = new Resume();
        resume.setFileName(file.getOriginalFilename());
        resume.setStatus("PROCESSING"); // Set status awal
        resume.setUploadedAt(LocalDateTime.now());
        return resumeRepository.save(resume);
    }

    // LANGKAH 2: Proses AI kat belakang tabir (Async)
    @Async
    public void processAiAsync(Long id, MultipartFile file) {
        try {
            // 1. Extract Text
            String extractedText = tika.parseToString(file.getInputStream());
            
            // 2. Call Python AI
            AiResponse response = restTemplate.postForObject(PYTHON_SERVICE_URL, Map.of("text", extractedText), AiResponse.class);

            // 3. Update data yang kita simpan tadi
            Resume resume = resumeRepository.findById(id).orElseThrow();
            
            if (response != null) {
                resume.setExtractedText(extractedText);
                resume.setPredictedDepartment(response.getTop_prediction().getDepartment());
                resume.setConfidenceScore(response.getTop_prediction().getConfidence());
                
                String jsonContent = objectMapper.writeValueAsString(response.getAll_predictions());
                resume.setAllPredictionsJson(jsonContent);
                resume.setStatus("COMPLETED"); // Dah siap!
            } else {
                resume.setStatus("FAILED");
            }
            
            resumeRepository.save(resume);

        } catch (Exception e) {
            // Kalau error, update status jadi FAILED supaya table tak stuck
            resumeRepository.findById(id).ifPresent(resume -> {
                resume.setStatus("FAILED");
                resumeRepository.save(resume);
            });
            e.printStackTrace();
        }
    }
}