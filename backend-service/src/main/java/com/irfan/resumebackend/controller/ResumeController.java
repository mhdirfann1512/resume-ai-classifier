package com.irfan.resumebackend.controller;

import com.irfan.resumebackend.model.Resume;
import com.irfan.resumebackend.service.ResumeService;
import com.irfan.resumebackend.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private ResumeService resumeService;
    
    @Autowired 
    private ResumeRepository resumeRepository;

    @PostMapping("/upload") 
    public Resume uploadResume(@RequestParam("file") MultipartFile file) throws Exception {
        // 1. Simpan rekod awal (Status: PROCESSING)
        Resume initialResume = resumeService.saveInitial(file);
        
        // 2. Panggil background process (Tak payah tunggu!)
        resumeService.processAiAsync(initialResume.getId(), file);
        
        // 3. Terus pulangkan objek resume yang baru dibuat tadi
        return initialResume;
    }

    @GetMapping
    public List<Resume> getAllResumes() {
        // Susun supaya yang terbaru kat atas
        return resumeRepository.findAllByOrderByIdDesc(); 
    }
}