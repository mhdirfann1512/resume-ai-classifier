package com.irfan.resumebackend.service;

import com.irfan.resumebackend.model.AiResponse;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
public class ResumeService {

    private final Tika tika = new Tika();
    private final RestTemplate restTemplate = new RestTemplate();

    public AiResponse processResume(MultipartFile file) throws Exception {
        // 1. Extract text from PDF/DOCX using Tika
        String extractedText = tika.parseToString(file.getInputStream());

        // 2. Prepare the request for Python AI
        String pythonUrl = "http://localhost:8000/classify";
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("text", extractedText);

        // 3. Send to Python and get the result
        return restTemplate.postForObject(pythonUrl, requestBody, AiResponse.class);
    }
}