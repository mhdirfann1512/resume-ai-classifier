package com.irfan.resumebackend.controller;

import com.irfan.resumebackend.model.AiResponse;
import com.irfan.resumebackend.model.Resume;
import com.irfan.resumebackend.service.ResumeService;
import com.irfan.resumebackend.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List; // 1. WAJIB TAMBAH NI untuk setelkan error "List"

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;
    
    @Autowired // 2. WAJIB TAMBAH NI supaya repository tak null
    private ResumeRepository resumeRepository;

    @PostMapping("/upload") 
    public AiResponse uploadResume(@RequestParam("file") MultipartFile file) throws Exception {
        return resumeService.processResume(file);
    }

    @GetMapping
    public List<Resume> getAllResumes() {
        return resumeRepository.findAll();
    }
}