package com.irfan.resumebackend.service;

import com.irfan.resumebackend.model.AiResponse;

import main.java.com.irfan.repository.ResumeRepository;
import main.java.com.irfan.resumebackend.model.Resume;

import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class ResumeService {
    private final Tika tika = new Tika();
    private final RestTemplate restTemplate = new RestTemplate();
   
    @Autowired
    private ResumeRepository resumeRepository;

    public AiResponse processResume(MultipartFile file) throws Exception {
        try {
            System.out.println(">>> [STEP 1] Received file: " + file.getOriginalFilename());
            
            // Extract text using Apache Tika
            String extractedText = tika.parseToString(file.getInputStream());
            System.out.println(">>> [STEP 2] Extracted text length: " + extractedText.length());

            if (extractedText.trim().isEmpty()) {
                System.out.println(">>> [WARNING] Extracted text is EMPTY. Check if the PDF is scanned as an image.");
            }

            String pythonUrl = "http://localhost:8000/classify";
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("text", extractedText);

            System.out.println(">>> [STEP 3] Sending request to Python at: " + pythonUrl);
            
            // Call the Python AI Service
            AiResponse response = restTemplate.postForObject(pythonUrl, requestBody, AiResponse.class);
            
            System.out.println(">>> [STEP 4] Received response from Python!");

            // After getting 'response' from Python...
            Resume resume = new Resume();
            resume.setFileName(file.getOriginalFilename());
            resume.setExtractedText(extractedText);
            resume.setPredictedDepartment(response.getTop_prediction().getDepartment());
            resume.setConfidenceScore(response.getTop_prediction().getConfidence());
            resume.setUploadedAt(LocalDateTime.now());

            // Save to Database
            resumeRepository.save(resume);
            
            return response;

        } catch (Exception e) {
            System.err.println(">>> [CRITICAL ERROR] Error during processing: " + e.getMessage());
            e.printStackTrace(); // This will finally show the red lines in your terminal
            throw e;
        }
    }
}