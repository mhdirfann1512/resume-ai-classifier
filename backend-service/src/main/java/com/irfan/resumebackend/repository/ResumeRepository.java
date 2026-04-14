package com.irfan.resumebackend.repository;

import com.irfan.resumebackend.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    
    // Jadi resume yang Irfan baru upload akan sentiasa duduk paling atas dalam table
    List<Resume> findAllByOrderByIdDesc();
}