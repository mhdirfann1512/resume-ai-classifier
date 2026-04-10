package com.irfan.resumebackend.controller;

import com.irfan.resumebackend.model.AiResponse;
import com.irfan.resumebackend.service.ResumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*") // Allows your frontend to talk to this backend
public class ResumeController {

    @Autowired
    private ResumeService resumeService;

    @PostMapping("/upload")
    public AiResponse uploadResume(@RequestParam("file") MultipartFile file) throws Exception {
        return resumeService.processResume(file);
    }
}